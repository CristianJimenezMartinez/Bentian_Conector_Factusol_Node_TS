// src/payments/types.ts

/** Datos básicos de cliente para Stripe o PayPal */
export interface CustomerInfo {
    email:   string;
    name?:   string;
    phone?:  string;
  }
  
  /** Resultado al crear/confirmar un pago */
  export interface PaymentIntentResult {
    id: string;
    status: string;
    /** el client_secret de Stripe para el 3DS, pago fallido, etc */
    clientSecret?: string;
    raw: any;
  }
  
  /** Evento webhook unificado */
  export interface WebhookEvent {
    type: string;
    data: any;
  }
  