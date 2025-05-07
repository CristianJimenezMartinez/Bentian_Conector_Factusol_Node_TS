"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInvoiceEmail = sendInvoiceEmail;
// src/services/invoiceEmailService.ts
const notificationService_1 = require("./notificationService");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const generateInvoicePDF_1 = require("../utils/generateInvoicePDF");
function sendInvoiceEmail(invoiceData) {
    return __awaiter(this, void 0, void 0, function* () {
        // 1) Calcula la fecha para el nombre del fichero
        const fecha = new Date().toISOString().split('T')[0];
        // 2) Define nombre y ruta donde guardarás el PDF
        const filename = `${invoiceData.invoiceId}-${fecha}.pdf`;
        const pdfDir = path.resolve(__dirname, '../pdfs');
        const pdfPath = path.join(pdfDir, filename);
        // 3) Asegúrate de que exista la carpeta
        yield fs.promises.mkdir(pdfDir, { recursive: true });
        // 4) Genera y guarda el PDF
        const pdfBuffer = yield (0, generateInvoicePDF_1.generateInvoicePDF)(invoiceData);
        yield fs.promises.writeFile(pdfPath, pdfBuffer);
        // 5) Envía el correo con el adjunto
        yield (0, notificationService_1.sendEmail)(invoiceData.customerEmail, `Tu factura #${invoiceData.invoiceId}`, 'Adjunto encontrarás tu factura.', `<p>Gracias por tu compra. Aquí tienes tu factura.</p>`, [
            {
                filename, // ahora existe
                path: pdfPath // ruta correcta al fichero
            }
        ]);
    });
}
