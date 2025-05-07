// utils/generateInvoicePDF.ts

import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import config from '../../config.json';
import { InvoiceData } from '../interfaces/InvoiceData';

/**
 * Genera un PDF de la factura usando pdf-lib y retorna el Buffer.
 * Soporta logo en JPG/PNG, desglosa IVA al 21%, 10% y 4%, y muestra coste de envío.
 */
export async function generateInvoicePDF(
  invoice: InvoiceData & { shippingCost?: number; tax21?: number; tax10?: number; tax4?: number }
): Promise<Buffer> {
  // 1. Crear documento y página A4
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // 2. Cargar fuentes
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 50;
  let cursorY = height - margin;

  // 3. Valores por defecto
  const shippingCostVal = invoice.shippingCost ?? 0;
  const tax21Val        = invoice.tax21        ?? 0;
  const tax10Val        = invoice.tax10        ?? 0;
  const tax4Val         = invoice.tax4         ?? 0;

  // 4. Logo (si existe)
  const logoSource = config.company?.logoPath || invoice.companyLogoUrl;
  if (logoSource) {
    try {
      const ext = path.extname(logoSource).toLowerCase();
      const raw = fs.readFileSync(logoSource);
      let embeddedImage;
      if (ext === '.png') {
        embeddedImage = await pdfDoc.embedPng(raw);
      } else if (ext === '.jpg' || ext === '.jpeg') {
        embeddedImage = await pdfDoc.embedJpg(raw);
      }
      if (embeddedImage) {
        // Escalar a 50px de altura
        const scale     = 50 / embeddedImage.height;
        const imgWidth  = embeddedImage.width * scale;
        const imgHeight = 50;
        page.drawImage(embeddedImage, {
          x: margin,
          y: cursorY - imgHeight,
          width: imgWidth,
          height: imgHeight,
        });
      }
    } catch (e) {
      console.warn('Logo no cargado:', e);
    }
  }

  // 5. Datos de la empresa
  const companyName    = config.company?.name    || invoice.companyName!;
  const companyAddress = config.company?.address || invoice.companyAddress;
  page.drawText(companyName,    { x: margin + 60, y: cursorY - 20, size: 18, font: fontBold });
  page.drawText(companyAddress, { x: margin + 60, y: cursorY - 40, size: 10, font });

  // 6. Cabecera de factura
  const headerY = cursorY - 80;
  page.drawText(`Factura #${invoice.invoiceId}`, { x: margin, y: headerY, size: 14, font: fontBold });
  page.drawText(`Fecha: ${invoice.date}`,        { x: width - margin - 100, y: headerY, size: 10, font });
  cursorY = headerY - 30;

  // 7. Datos del cliente
  page.drawText('Datos del cliente:', { x: margin, y: cursorY, size: 12, font: fontBold });
  cursorY -= 18;
  [
    `Nombre:    ${invoice.customerName}`,
    `Email:     ${invoice.customerEmail}`,
    `Dirección: ${invoice.customerAddress}`
  ].forEach(line => {
    page.drawText(line, { x: margin + 10, y: cursorY, size: 10, font });
    cursorY -= 14;
  });
  cursorY -= 20;

  // 8. Tabla de líneas (neto)
  page.drawText('Descripción',     { x: margin,       y: cursorY, size: 10, font: fontBold });
  page.drawText('Cant.',           { x: margin + 300, y: cursorY, size: 10, font: fontBold });
  page.drawText('P. Unit. (neto)', { x: margin + 360, y: cursorY, size: 10, font: fontBold });
  page.drawText('Total (neto)',    { x: margin + 460, y: cursorY, size: 10, font: fontBold });
  cursorY -= 16;

  // Calcular subtotal neto
  const netSubtotal = invoice.lines.reduce((sum, line) =>
    sum + line.unitPrice * line.quantity, 0
  );

  // Dibujar cada línea
  invoice.lines.forEach(line => {
    page.drawText(line.description,           { x: margin,       y: cursorY, size: 10, font });
    page.drawText(line.quantity.toString(),   { x: margin + 300, y: cursorY, size: 10, font });
    page.drawText(line.unitPrice.toFixed(2),  { x: margin + 360, y: cursorY, size: 10, font });
    page.drawText((line.unitPrice * line.quantity).toFixed(2), { x: margin + 460, y: cursorY, size: 10, font });
    cursorY -= 16;
  });
  cursorY -= 20;

  // 9. Totales
  const cx = margin + 300;

  page.drawText(`Subtotal: €${netSubtotal.toFixed(2)}`,     { x: cx, y: cursorY, size: 10, font: fontBold });
  cursorY -= 14;

  // Siempre mostrar envío
  page.drawText(`Envío:   €${shippingCostVal.toFixed(2)}`,  { x: cx, y: cursorY, size: 10, font: fontBold });
  cursorY -= 14;

  page.drawText(`IVA 21%: €${invoice.tax21!.toFixed(2)}`, { x: cx, y: cursorY, size: 10, font: fontBold });
  cursorY -= 14;

  page.drawText(`IVA 10%: €${invoice.tax10!.toFixed(2)}`, { x: cx, y: cursorY, size: 10, font: fontBold });
  cursorY -= 14;

  page.drawText(`IVA 4%:  €${invoice.tax4!.toFixed(2)}`, { x: cx, y: cursorY, size: 10, font: fontBold });
  cursorY -= 14;

  const totalFinal = invoice.total ?? (netSubtotal + shippingCostVal + tax21Val + tax10Val + tax4Val);
  page.drawText(`Total:   €${totalFinal.toFixed(2)}`,      { x: cx, y: cursorY, size: 10, font: fontBold });

  // 10. Finalizar y devolver buffer
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
