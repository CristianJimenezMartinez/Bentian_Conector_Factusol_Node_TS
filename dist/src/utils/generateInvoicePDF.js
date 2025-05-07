"use strict";
// utils/generateInvoicePDF.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoicePDF = generateInvoicePDF;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_lib_1 = require("pdf-lib");
const config_json_1 = __importDefault(require("../../config.json"));
/**
 * Genera un PDF de la factura usando pdf-lib y retorna el Buffer.
 * Soporta logo en JPG/PNG, desglosa IVA al 21%, 10% y 4%, y muestra coste de envío.
 */
function generateInvoicePDF(invoice) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        // 1. Crear documento y página A4
        const pdfDoc = yield pdf_lib_1.PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();
        // 2. Cargar fuentes
        const fontBold = yield pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
        const font = yield pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const margin = 50;
        let cursorY = height - margin;
        // 3. Valores por defecto
        const shippingCostVal = (_a = invoice.shippingCost) !== null && _a !== void 0 ? _a : 0;
        const tax21Val = (_b = invoice.tax21) !== null && _b !== void 0 ? _b : 0;
        const tax10Val = (_c = invoice.tax10) !== null && _c !== void 0 ? _c : 0;
        const tax4Val = (_d = invoice.tax4) !== null && _d !== void 0 ? _d : 0;
        // 4. Logo (si existe)
        const logoSource = ((_e = config_json_1.default.company) === null || _e === void 0 ? void 0 : _e.logoPath) || invoice.companyLogoUrl;
        if (logoSource) {
            try {
                const ext = path_1.default.extname(logoSource).toLowerCase();
                const raw = fs_1.default.readFileSync(logoSource);
                let embeddedImage;
                if (ext === '.png') {
                    embeddedImage = yield pdfDoc.embedPng(raw);
                }
                else if (ext === '.jpg' || ext === '.jpeg') {
                    embeddedImage = yield pdfDoc.embedJpg(raw);
                }
                if (embeddedImage) {
                    // Escalar a 50px de altura
                    const scale = 50 / embeddedImage.height;
                    const imgWidth = embeddedImage.width * scale;
                    const imgHeight = 50;
                    page.drawImage(embeddedImage, {
                        x: margin,
                        y: cursorY - imgHeight,
                        width: imgWidth,
                        height: imgHeight,
                    });
                }
            }
            catch (e) {
                console.warn('Logo no cargado:', e);
            }
        }
        // 5. Datos de la empresa
        const companyName = ((_f = config_json_1.default.company) === null || _f === void 0 ? void 0 : _f.name) || invoice.companyName;
        const companyAddress = ((_g = config_json_1.default.company) === null || _g === void 0 ? void 0 : _g.address) || invoice.companyAddress;
        page.drawText(companyName, { x: margin + 60, y: cursorY - 20, size: 18, font: fontBold });
        page.drawText(companyAddress, { x: margin + 60, y: cursorY - 40, size: 10, font });
        // 6. Cabecera de factura
        const headerY = cursorY - 80;
        page.drawText(`Factura #${invoice.invoiceId}`, { x: margin, y: headerY, size: 14, font: fontBold });
        page.drawText(`Fecha: ${invoice.date}`, { x: width - margin - 100, y: headerY, size: 10, font });
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
        page.drawText('Descripción', { x: margin, y: cursorY, size: 10, font: fontBold });
        page.drawText('Cant.', { x: margin + 300, y: cursorY, size: 10, font: fontBold });
        page.drawText('P. Unit. (neto)', { x: margin + 360, y: cursorY, size: 10, font: fontBold });
        page.drawText('Total (neto)', { x: margin + 460, y: cursorY, size: 10, font: fontBold });
        cursorY -= 16;
        // Calcular subtotal neto
        const netSubtotal = invoice.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
        // Dibujar cada línea
        invoice.lines.forEach(line => {
            page.drawText(line.description, { x: margin, y: cursorY, size: 10, font });
            page.drawText(line.quantity.toString(), { x: margin + 300, y: cursorY, size: 10, font });
            page.drawText(line.unitPrice.toFixed(2), { x: margin + 360, y: cursorY, size: 10, font });
            page.drawText((line.unitPrice * line.quantity).toFixed(2), { x: margin + 460, y: cursorY, size: 10, font });
            cursorY -= 16;
        });
        cursorY -= 20;
        // 9. Totales
        const cx = margin + 300;
        page.drawText(`Subtotal: €${netSubtotal.toFixed(2)}`, { x: cx, y: cursorY, size: 10, font: fontBold });
        cursorY -= 14;
        // Siempre mostrar envío
        page.drawText(`Envío:   €${shippingCostVal.toFixed(2)}`, { x: cx, y: cursorY, size: 10, font: fontBold });
        cursorY -= 14;
        page.drawText(`IVA 21%: €${invoice.tax21.toFixed(2)}`, { x: cx, y: cursorY, size: 10, font: fontBold });
        cursorY -= 14;
        page.drawText(`IVA 10%: €${invoice.tax10.toFixed(2)}`, { x: cx, y: cursorY, size: 10, font: fontBold });
        cursorY -= 14;
        page.drawText(`IVA 4%:  €${invoice.tax4.toFixed(2)}`, { x: cx, y: cursorY, size: 10, font: fontBold });
        cursorY -= 14;
        const totalFinal = (_h = invoice.total) !== null && _h !== void 0 ? _h : (netSubtotal + shippingCostVal + tax21Val + tax10Val + tax4Val);
        page.drawText(`Total:   €${totalFinal.toFixed(2)}`, { x: cx, y: cursorY, size: 10, font: fontBold });
        // 10. Finalizar y devolver buffer
        const pdfBytes = yield pdfDoc.save();
        return Buffer.from(pdfBytes);
    });
}
