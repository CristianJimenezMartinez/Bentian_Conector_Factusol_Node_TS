// src/payment/StripeGateway.ts

import Stripe from 'stripe';
import {
  CustomerInfo,
  PaymentIntentResult,
  WebhookEvent,
} from './types';
import { PaymentGateway } from './PaymentGateway';

export class StripeGateway implements PaymentGateway {
  constructor(
    private stripe: Stripe,
    private webhookSecret: string
  ) {}

  async createCustomer(data: CustomerInfo): Promise<string> {
    const cust = await this.stripe.customers.create({
      email: data.email,
      name: data.name,
      phone: data.phone,
      metadata: {},
    });
    return cust.id;
  }

  async attachPaymentMethod(
    customerId: string,
    methodId: string
  ): Promise<void> {
    await this.stripe.paymentMethods.attach(methodId, {
      customer: customerId,
    });
  }

  async retrievePaymentMethod(
    methodId: string
  ): Promise<{ customerId: string | null }> {
    const pm = await this.stripe.paymentMethods.retrieve(methodId);
    return { customerId: (pm.customer as string) ?? null };
  }

  async createAndConfirmPayment(
    amount: number,
    currency: string,
    opts: {
      customerId: string;
      paymentMethodId: string;
      metadata: Record<string, string>;
    }
  ): Promise<PaymentIntentResult> {
    const pi = await this.stripe.paymentIntents.create({
      amount,
      currency,
      customer: opts.customerId,
      payment_method: opts.paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      // ← Forzamos solo pagos con tarjeta, sin redirecciones
      payment_method_types: ['card'],
      metadata: opts.metadata,
    });

    return {
      id: pi.id,
      status: pi.status,
      clientSecret: pi.client_secret ?? '',
      raw: pi,
    };
  }

  async handleWebhookEvent(
    rawBody: Buffer,
    signature: string
  ): Promise<WebhookEvent> {
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret
    );
    return { type: event.type, data: event.data.object };
  }
}
