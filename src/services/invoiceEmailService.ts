// src/services/invoiceEmailService.ts
import { sendEmail } from './notificationService';
import * as path from 'path';
import * as fs from 'fs';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';
import { InvoiceData } from '../interfaces/InvoiceData';

export async function sendInvoiceEmail(invoiceData: InvoiceData) {
  // 1) Calcula la fecha para el nombre del fichero
  const fecha = new Date().toISOString().split('T')[0];

  // 2) Define nombre y ruta donde guardarás el PDF
  const filename = `${invoiceData.invoiceId}-${fecha}.pdf`;
  const pdfDir  = path.resolve(__dirname, '../pdfs');
  const pdfPath = path.join(pdfDir, filename);

  // 3) Asegúrate de que exista la carpeta
  await fs.promises.mkdir(pdfDir, { recursive: true });

  // 4) Genera y guarda el PDF
  const pdfBuffer = await generateInvoicePDF(invoiceData);
  await fs.promises.writeFile(pdfPath, pdfBuffer);

  // 5) Envía el correo con el adjunto
  await sendEmail(
    invoiceData.customerEmail,
    `Tu factura #${invoiceData.invoiceId}`,
    'Adjunto encontrarás tu factura.',
    `<p>Gracias por tu compra. Aquí tienes tu factura.</p>`,
    [
      {
        filename,      // ahora existe
        path: pdfPath  // ruta correcta al fichero
      }
    ]
  );
}
