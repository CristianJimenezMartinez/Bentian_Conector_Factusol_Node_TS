// src/controllers/paymentController.ts

import { Request, Response }       from 'express';
import { updateFacturaEstado }     from './invoicesController';
import { updateStock }             from '../services/stockService';
import pool                        from './helpers/pool';
import { createPedidoEnBases }     from '../services/orderService';
import { PaymentGateway }          from '../payment/PaymentGateway';

import Stripe                      from 'stripe';
import { StripeGateway }           from '../payment/StripeGateway';

import PayPal                      from '@paypal/checkout-server-sdk';
import { PayPalGateway }           from '../payment/PayPalGateway';

import config                      from '../../config.json';

// ——— Inicializamos ambos gateways ———

// Stripe
const stripeClient = new Stripe(config.stripe.privateKey, {
  apiVersion: config.stripe.apiVersion as '2025-03-31.basil'
});
const stripeGw = new StripeGateway(stripeClient, config.stripe.webhookSecret);

// PayPal
const ppEnv = config.paypal.mode === 'live'
  ? new PayPal.core.LiveEnvironment(
      config.paypal.clientId!,
      config.paypal.clientSecret!
    )
  : new PayPal.core.SandboxEnvironment(
      config.paypal.clientId!,
      config.paypal.clientSecret!
    );
const ppClient = new PayPal.core.PayPalHttpClient(ppEnv);
const paypalGw = new PayPalGateway(ppClient);

// ——— Endpoint de notificación externa (POST /api/payment) ———
export async function paymentNotification(req: Request, res: Response): Promise<any> {
  const { codfac, nuevoEstado, token } = req.body;
  const secret = config.paymentNotificationToken;
  if (token !== secret) {
    return res.status(403).json({ error: 'Token inválido' });
  }
  try {
    await updateFacturaEstado(
      { body: { codfac, nuevoEstado } } as Request,
      res
    );
  } catch (err) {
    console.error('[paymentNotification] Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error procesando notificación' });
    }
  }
}

// ——— Endpoint de creación de pedido + pago (POST /api/payment/orders) ———
export async function processOrder(req: Request, res: Response): Promise<any> {
  const {
    order,
    paymentMethodId,
    paymentMethodType,
    shippingData,
    shippingMethod,
    shippingCost
  }: {
    order: { cabecera: any; lineas: any[] };
    paymentMethodId: string;
    paymentMethodType: 'stripe' | 'paypal';
    shippingData: { fullName: string; email: string; phone: string };
    shippingMethod: string;
    shippingCost: number;
  } = req.body;

  // Validación básica
  if (!order || !paymentMethodId || !paymentMethodType
      || !shippingData?.email || !shippingData?.phone) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  // 1) Idempotencia: reusar pedido por ref externa
  const ref = String(order.cabecera.refpcl).substring(0, 12);
  const existRes = await pool.query(
    'SELECT codpcl FROM f_pcl WHERE refpcl = $1',
    [ref]
  );
  let pedidoId: number;
  if ((existRes.rowCount ?? 0) > 0) {
    pedidoId = +existRes.rows[0].codpcl;
    console.log(`[processOrder] Pedido ya existe refpcl=${ref}, codpcl=${pedidoId}`);
  } else {
    // 2) Actualizar stock
    try {
      for (const linea of order.lineas) {
        await updateStock(linea.artlpc, linea.canlpc);
      }
    } catch (err) {
      console.error('[processOrder] Error actualizando stock:', err);
      return res.status(500).json({ error: 'Error actualizando stock' });
    }
    // 3) Crear pedido en PostgreSQL + Access
    try {
      pedidoId = await createPedidoEnBases(order.cabecera, order.lineas);
    } catch (err) {
      console.error('[processOrder] Error creando pedido:', err);
      return res.status(500).json({ error: 'No se pudo crear el pedido' });
    }
  }

  // 4) Escoger gateway según tipo
  const gateway: PaymentGateway =
    paymentMethodType === 'paypal' ? paypalGw : stripeGw;

  // 5) Procesar el pago
  try {
    // 5.1) Recuperar o crear customer
    let customerId: string;
    const existing = await gateway.retrievePaymentMethod(paymentMethodId);
    if (existing?.customerId) {
      customerId = existing.customerId;
    } else {
      customerId = await gateway.createCustomer({
        name:  shippingData.fullName,
        email: shippingData.email,
        phone: shippingData.phone
      });
      await gateway.attachPaymentMethod(customerId, paymentMethodId);
    }

    // 5.2) Crear y confirmar pago
    const pi = await gateway.createAndConfirmPayment(
      Math.round(order.cabecera.net1pcl * 100),
      'EUR',
      {
        customerId,
        paymentMethodId,
        metadata: {
          orderId:      String(pedidoId),
          email:        shippingData.email,
          phone:        shippingData.phone,
          shipMethod:   shippingMethod,
          shippingCost: String(shippingCost)
        }
      }
    );

    // 5.3) Si requiere 3DS / acción adicional
    if (pi.status === 'requires_action') {
      return res.status(200).json({
        requiresAction: true,
        clientSecret:   pi.clientSecret
      });
    }

    // 5.4) Pago OK
    return res.status(201).json({
      message:   'Pedido y pago procesados correctamente',
      pedidoId,
      paymentId: pi.id,
      rawResult: pi.raw
    });

  } catch (err) {
    console.error('[processOrder] Payment error:', err);
    return res.status(500).json({ error: 'Error procesando el pago' });
  }
}
