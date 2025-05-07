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
const config_json_1 = __importDefault(require("../../config.json"));
const smtpConfig = config_json_1.default.smtp;
const transporter = nodemailer_1.default.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: false, // true para puertos 465, false para otros
    auth: {
        user: smtpConfig.user,
        pass: smtpConfig.password
    }
});
/**
 * Envía un email, opcionalmente con adjuntos.
 * @param to       Destinatario
 * @param subject  Asunto
 * @param text     Texto plano
 * @param html     HTML opcional
 * @param attachments  Array de adjuntos (objetos con filename y path)
 */
function sendEmail(to, subject, text, html, attachments) {
    return __awaiter(this, void 0, void 0, function* () {
        const mailOptions = {
            from: smtpConfig.from,
            to,
            subject,
            text,
            html,
            attachments
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
