import PayPal from '@paypal/checkout-server-sdk';
import {
  CustomerInfo,
  PaymentIntentResult,
  WebhookEvent,
} from './types';
import { PaymentGateway } from './PaymentGateway';

export class PayPalGateway implements PaymentGateway {
  constructor(private client: PayPal.core.PayPalHttpClient) {}

  async createCustomer(_info: CustomerInfo): Promise<string> {
    // PayPal no implementa “customer” igual a Stripe
    return '';
  }

  async attachPaymentMethod(
    _customerId: string,
    _methodId: string
  ): Promise<void> {
    // Nada que hacer, o guardar en tus propios metadatos
  }

  async retrievePaymentMethod(
    _methodId: string
  ): Promise<{ customerId: string | null }> {
    // PayPal no tiene customer, devolvemos null
    return { customerId: null };
  }

  async createAndConfirmPayment(
    amount: number,
    currency: string,
    _opts: {
      customerId: string;
      paymentMethodId: string;
      metadata: Record<string, string>;
    }
  ): Promise<PaymentIntentResult> {
    // 1) Crear orden
    const orderReq = new PayPal.orders.OrdersCreateRequest();
    orderReq.prefer('return=representation');
    orderReq.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        { amount: { currency_code: currency, value: amount.toFixed(2) } },
      ],
    });
    const { result: order } = await this.client.execute(orderReq);

    // 2) Capturar sin body
    const captureReq = new PayPal.orders.OrdersCaptureRequest(order.id!);
    captureReq.prefer('return=representation');
    const { result: capture } = await this.client.execute(captureReq);

    return {
      id: capture.id!,
      status: capture.status!,
      raw: capture,
    };
  }

  async handleWebhookEvent(
    rawBody: Buffer,
    _signature: string
  ): Promise<WebhookEvent> {
    const event = JSON.parse(rawBody.toString());
    return { type: event.event_type, data: event.resource };
  }
}
