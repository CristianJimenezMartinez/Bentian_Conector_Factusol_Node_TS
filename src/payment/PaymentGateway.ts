// src/payments/PaymentGateway.ts
import { CustomerInfo, PaymentIntentResult, WebhookEvent } from './types';

export interface PaymentGateway {
    /** Crea (o devuelve) un customer ID */
    createCustomer(data: CustomerInfo): Promise<string>;
    /** Asocia un método de pago a un customer */
    attachPaymentMethod(customerId: string, methodId: string): Promise<void>;
  
    /** Recupera info del método de pago (p.ej. customer asociado) */
    retrievePaymentMethod(
      methodId: string
    ): Promise<{ customerId: string | null }>;
  
    /** Crea y confirma el pago */
    createAndConfirmPayment(
      amount: number,
      currency: string,
      opts: {
        customerId: string;
        paymentMethodId: string;
        metadata: Record<string, string>;
      }
    ): Promise<PaymentIntentResult>;
  
    /** Procesa un webhook raw */
    handleWebhookEvent(rawBody: Buffer, signature: string): Promise<WebhookEvent>;
  }
