// interfaces/InvoiceData.ts
export interface InvoiceLine {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }
  
  export interface InvoiceData {
    invoiceId: number;
    date: string;             // Se recomienda usar formato ISO o local, por ejemplo "2025-04-16"
    customerName: string;
    customerEmail: string;    // Este dato puede venir de la cabecera de pedido
    customerAddress: string;
    companyName: string;      // Datos de la empresa emisora
    companyLogoUrl?: string;  // URL del logo de la empresa (opcional)
    companyAddress: string;
    lines: InvoiceLine[];
    subTotal: number;
    shippingCost?: number;    // Coste de envío (opcional)
    tax21?: number;           // Importe de IVA al 21%
    tax10?: number;           // Importe de IVA al 10%
    tax4?: number;            // Importe de IVA al 4%
    total: number;            // Importe total a pagar (subtotal + portes + todos los impuestos)
  }
  
  