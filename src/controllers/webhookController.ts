// src/controllers/webhookController.ts

import { Request, Response } from 'express';
import Stripe from 'stripe';
import config from '../../config.json';
import pool from './helpers/pool';
import { sendEmail } from './notificationService';
import { io } from '../socket';
import { createInvoiceForOrder } from './invoicesController';

const stripe = new Stripe(config.stripe.privateKey, {
  apiVersion: config.stripe.apiVersion as '2025-03-31.basil'
});
const endpointSecret = config.stripe.webhookSecret;

/**
 * Envía feedback al cliente vía WebSocket
 */
function sendFeedback(orderId: string, message: string): void {
  if (io) {
    io.to(orderId).emit('paymentFeedback', { orderId, message });
    console.log(`[WEBHOOK] Feedback a ${orderId}: ${message}`);
  }
}

/**
 * Extrae el pedidoId de los metadatos de Stripe
 */
function extractPedidoId(metadata: Stripe.Metadata): string | null {
  const raw = metadata.orderId || metadata.orderRef;
  return raw ? raw.replace(/^Id=/, '') : null;
}

/**
 * Envía email de confirmación de pedido
 */
async function notifyOrderPaid(email: string, pedidoId: string): Promise<void> {
  const subject = `Tu pedido ${pedidoId} está confirmado`;
  const text    = `¡Gracias por tu compra! Tu pedido ${pedidoId} ha sido confirmado.`;
  const html    = `<p>¡Gracias por tu compra!</p><p>Tu pedido <strong>${pedidoId}</strong> ha sido confirmado.</p>`;
  console.log('[WEBHOOK] Enviando confirmación a:', email);
  await sendEmail(email, subject, text, html);
}

/**
 * Handler para el webhook de Stripe
 */
export async function stripeWebhookHandler(req: Request, res: Response): Promise<any> {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  // 1) Verificar firma
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('[WEBHOOK] Evento recibido:', event.type);
  } catch (err: any) {
    console.error('[WEBHOOK] Firma inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 2) Solo procesar payment_intent.succeeded
  if (event.type !== 'payment_intent.succeeded') {
    return res.json({ received: true });
  }

  const pi = event.data.object as Stripe.PaymentIntent;
  const pedidoId      = extractPedidoId(pi.metadata);
  const customerEmail = pi.metadata.email as string;

  if (!pedidoId || !customerEmail) {
    console.error('[WEBHOOK] Metadata incompleta:', pi.metadata);
    sendFeedback(pedidoId || 'unknown', 'Error: metadata incompleta.');
    return res.status(400).end();
  }

  // 3) Marcar pedido como PAGADO en PostgreSQL
  await pool.query(
    'UPDATE f_pcl SET estpcl = $1 WHERE codpcl = $2',
    ['2', pedidoId]
  );

  // 4) Responder de inmediato a Stripe para evitar reintentos
  res.json({ received: true });

  // 5) Procesamiento en segundo plano
  (async () => {
    try {
      // 5.1) Obtener shippingCost de metadata o base de datos
      let shippingCost = pi.metadata.shippingCost
        ? parseFloat(pi.metadata.shippingCost)
        : 0;
      if (shippingCost === 0) {
        const dbRes = await pool.query(
          'SELECT COALESCE(ipor1pcl, 0) AS cost FROM f_pcl WHERE codpcl = $1',
          [pedidoId]
        );
        shippingCost = parseFloat(dbRes.rows[0]?.cost) || 0;
        console.log(`[WEBHOOK] shippingCost BD: €${shippingCost.toFixed(2)}`);
      } else {
        console.log(`[WEBHOOK] shippingCost metadata: €${shippingCost.toFixed(2)}`);
      }

      // 5.2) Recuperar referencia externa del pedido
      const headerRes = await pool.query(
        'SELECT refpcl FROM f_pcl WHERE codpcl = $1',
        [pedidoId]
      );
      const externalRef = headerRes.rows[0]?.refpcl;
      if (!externalRef) {
        console.error(`[WEBHOOK BG] No existe refpcl para pedido ${pedidoId}`);
        sendFeedback(pedidoId, 'Error al obtener referencia de pedido.');
        return;
      }

      // 5.3) Comprobar si ya existe factura con esa referencia
      const existRes = await pool.query(
        'SELECT COUNT(*) AS cnt FROM f_fac WHERE reffac = $1',
        [externalRef]
      );
      const invoiceExists = parseInt(existRes.rows[0].cnt, 10) > 0;

      if (invoiceExists) {
        console.log(`[WEBHOOK] Factura ya existe reffac=${externalRef}, omitiendo.`);
      } else {
        console.log(`[WEBHOOK] Creando factura reffac=${externalRef}`);
        try {
          await createInvoiceForOrder(pedidoId, shippingCost);
        } catch (err: any) {
          // Si otro proceso ya creó la factura, ignoramos el error de PK duplicada
          if (err.code === '23505') {
            console.warn(
              `[WEBHOOK] Duplicado detectado al crear factura para reffac=${externalRef}, ignorando.`
            );
          } else {
            throw err;
          }
        }
      }

      // 5.4) Enviar confirmación por email y socket
      try {
        await notifyOrderPaid(customerEmail, pedidoId);
      } catch (mailErr) {
        console.error('[WEBHOOK] Error enviando email:', mailErr);
      }
      sendFeedback(
        pedidoId,
        invoiceExists
          ? 'Factura ya existía, omitiendo duplicado.'
          : 'Pago confirmado y factura generada.'
      );
    } catch (bgErr) {
      console.error('[WEBHOOK BG] Error en procesamiento:', bgErr);
      sendFeedback(pedidoId, 'Error interno procesando tu factura.');
    }
  })();
}
