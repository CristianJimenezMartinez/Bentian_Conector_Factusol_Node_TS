"use strict";
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
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST, // Por ejemplo, smtp.gmail.com
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
function sendEmail(to, subject, text, html) {
    return __awaiter(this, void 0, void 0, function* () {
        const mailOptions = {
            from: process.env.SMTP_FROM, // Dirección del remitente
            to,
            subject,
            text,
            html
        };
        try {
            const info = yield transporter.sendMail(mailOptions);
            console.log('Correo enviado:', info.response);
            return info;
        }
        catch (error) {
            console.error('Error enviando correo:', error);
            throw error;
        }
    });
}
