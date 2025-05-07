"use strict";
// src/controllers/webhookController.ts
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
exports.stripeWebhookHandler = stripeWebhookHandler;
const stripe_1 = __importDefault(require("stripe"));
const config_json_1 = __importDefault(require("../../config.json"));
const pool_1 = __importDefault(require("./helpers/pool"));
const notificationService_1 = require("./notificationService");
const socket_1 = require("../socket");
const invoicesController_1 = require("./invoicesController");
const stripe = new stripe_1.default(config_json_1.default.stripe.privateKey, {
    apiVersion: config_json_1.default.stripe.apiVersion
});
const endpointSecret = config_json_1.default.stripe.webhookSecret;
/**
 * Envía feedback al cliente vía WebSocket
 */
function sendFeedback(orderId, message) {
    if (socket_1.io) {
        socket_1.io.to(orderId).emit('paymentFeedback', { orderId, message });
        console.log(`[WEBHOOK] Feedback a ${orderId}: ${message}`);
    }
}
/**
 * Extrae el pedidoId de los metadatos de Stripe
 */
function extractPedidoId(metadata) {
    const raw = metadata.orderId || metadata.orderRef;
    return raw ? raw.replace(/^Id=/, '') : null;
}
/**
 * Envía email de confirmación de pedido
 */
function notifyOrderPaid(email, pedidoId) {
    return __awaiter(this, void 0, void 0, function* () {
        const subject = `Tu pedido ${pedidoId} está confirmado`;
        const text = `¡Gracias por tu compra! Tu pedido ${pedidoId} ha sido confirmado.`;
        const html = `<p>¡Gracias por tu compra!</p><p>Tu pedido <strong>${pedidoId}</strong> ha sido confirmado.</p>`;
        console.log('[WEBHOOK] Enviando confirmación a:', email);
        yield (0, notificationService_1.sendEmail)(email, subject, text, html);
    });
}
/**
 * Handler para el webhook de Stripe
 */
function stripeWebhookHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const sig = req.headers['stripe-signature'];
        let event;
        // 1) Verificar firma
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
            console.log('[WEBHOOK] Evento recibido:', event.type);
        }
        catch (err) {
            console.error('[WEBHOOK] Firma inválida:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        // 2) Solo procesar payment_intent.succeeded
        if (event.type !== 'payment_intent.succeeded') {
            return res.json({ received: true });
        }
        const pi = event.data.object;
        const pedidoId = extractPedidoId(pi.metadata);
        const customerEmail = pi.metadata.email;
        if (!pedidoId || !customerEmail) {
            console.error('[WEBHOOK] Metadata incompleta:', pi.metadata);
            sendFeedback(pedidoId || 'unknown', 'Error: metadata incompleta.');
            return res.status(400).end();
        }
        // 3) Marcar pedido como PAGADO en PostgreSQL
        yield pool_1.default.query('UPDATE f_pcl SET estpcl = $1 WHERE codpcl = $2', ['2', pedidoId]);
        // 4) Responder de inmediato a Stripe para evitar reintentos
        res.json({ received: true });
        // 5) Procesamiento en segundo plano
        (() => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                // 5.1) Obtener shippingCost de metadata o base de datos
                let shippingCost = pi.metadata.shippingCost
                    ? parseFloat(pi.metadata.shippingCost)
                    : 0;
                if (shippingCost === 0) {
                    const dbRes = yield pool_1.default.query('SELECT COALESCE(ipor1pcl, 0) AS cost FROM f_pcl WHERE codpcl = $1', [pedidoId]);
                    shippingCost = parseFloat((_a = dbRes.rows[0]) === null || _a === void 0 ? void 0 : _a.cost) || 0;
                    console.log(`[WEBHOOK] shippingCost BD: €${shippingCost.toFixed(2)}`);
                }
                else {
                    console.log(`[WEBHOOK] shippingCost metadata: €${shippingCost.toFixed(2)}`);
                }
                // 5.2) Recuperar referencia externa del pedido
                const headerRes = yield pool_1.default.query('SELECT refpcl FROM f_pcl WHERE codpcl = $1', [pedidoId]);
                const externalRef = (_b = headerRes.rows[0]) === null || _b === void 0 ? void 0 : _b.refpcl;
                if (!externalRef) {
                    console.error(`[WEBHOOK BG] No existe refpcl para pedido ${pedidoId}`);
                    sendFeedback(pedidoId, 'Error al obtener referencia de pedido.');
                    return;
                }
                // 5.3) Comprobar si ya existe factura con esa referencia
                const existRes = yield pool_1.default.query('SELECT COUNT(*) AS cnt FROM f_fac WHERE reffac = $1', [externalRef]);
                const invoiceExists = parseInt(existRes.rows[0].cnt, 10) > 0;
                if (invoiceExists) {
                    console.log(`[WEBHOOK] Factura ya existe reffac=${externalRef}, omitiendo.`);
                }
                else {
                    console.log(`[WEBHOOK] Creando factura reffac=${externalRef}`);
                    try {
                        yield (0, invoicesController_1.createInvoiceForOrder)(pedidoId, shippingCost);
                    }
                    catch (err) {
                        // Si otro proceso ya creó la factura, ignoramos el error de PK duplicada
                        if (err.code === '23505') {
                            console.warn(`[WEBHOOK] Duplicado detectado al crear factura para reffac=${externalRef}, ignorando.`);
                        }
                        else {
                            throw err;
                        }
                    }
                }
                // 5.4) Enviar confirmación por email y socket
                try {
                    yield notifyOrderPaid(customerEmail, pedidoId);
                }
                catch (mailErr) {
                    console.error('[WEBHOOK] Error enviando email:', mailErr);
                }
                sendFeedback(pedidoId, invoiceExists
                    ? 'Factura ya existía, omitiendo duplicado.'
                    : 'Pago confirmado y factura generada.');
            }
            catch (bgErr) {
                console.error('[WEBHOOK BG] Error en procesamiento:', bgErr);
                sendFeedback(pedidoId, 'Error interno procesando tu factura.');
            }
        }))();
    });
}
