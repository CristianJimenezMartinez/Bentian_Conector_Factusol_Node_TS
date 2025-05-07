"use strict";
// src/controllers/paymentController.ts
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
exports.paymentNotification = paymentNotification;
exports.processOrder = processOrder;
const invoicesController_1 = require("./invoicesController");
const stockService_1 = require("../services/stockService");
const pool_1 = __importDefault(require("./helpers/pool"));
const orderService_1 = require("../services/orderService");
const stripe_1 = __importDefault(require("stripe"));
const StripeGateway_1 = require("../payment/StripeGateway");
const checkout_server_sdk_1 = __importDefault(require("@paypal/checkout-server-sdk"));
const PayPalGateway_1 = require("../payment/PayPalGateway");
const config_json_1 = __importDefault(require("../../config.json"));
// ——— Inicializamos ambos gateways ———
// Stripe
const stripeClient = new stripe_1.default(config_json_1.default.stripe.privateKey, {
    apiVersion: config_json_1.default.stripe.apiVersion
});
const stripeGw = new StripeGateway_1.StripeGateway(stripeClient, config_json_1.default.stripe.webhookSecret);
// PayPal
const ppEnv = config_json_1.default.paypal.mode === 'live'
    ? new checkout_server_sdk_1.default.core.LiveEnvironment(config_json_1.default.paypal.clientId, config_json_1.default.paypal.clientSecret)
    : new checkout_server_sdk_1.default.core.SandboxEnvironment(config_json_1.default.paypal.clientId, config_json_1.default.paypal.clientSecret);
const ppClient = new checkout_server_sdk_1.default.core.PayPalHttpClient(ppEnv);
const paypalGw = new PayPalGateway_1.PayPalGateway(ppClient);
// ——— Endpoint de notificación externa (POST /api/payment) ———
function paymentNotification(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { codfac, nuevoEstado, token } = req.body;
        const secret = config_json_1.default.paymentNotificationToken;
        if (token !== secret) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        try {
            yield (0, invoicesController_1.updateFacturaEstado)({ body: { codfac, nuevoEstado } }, res);
        }
        catch (err) {
            console.error('[paymentNotification] Error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error procesando notificación' });
            }
        }
    });
}
// ——— Endpoint de creación de pedido + pago (POST /api/payment/orders) ———
function processOrder(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { order, paymentMethodId, paymentMethodType, shippingData, shippingMethod, shippingCost } = req.body;
        // Validación básica
        if (!order || !paymentMethodId || !paymentMethodType
            || !(shippingData === null || shippingData === void 0 ? void 0 : shippingData.email) || !(shippingData === null || shippingData === void 0 ? void 0 : shippingData.phone)) {
            return res.status(400).json({ error: 'Faltan parámetros' });
        }
        // 1) Idempotencia: reusar pedido por ref externa
        const ref = String(order.cabecera.refpcl).substring(0, 12);
        const existRes = yield pool_1.default.query('SELECT codpcl FROM f_pcl WHERE refpcl = $1', [ref]);
        let pedidoId;
        if (((_a = existRes.rowCount) !== null && _a !== void 0 ? _a : 0) > 0) {
            pedidoId = +existRes.rows[0].codpcl;
            console.log(`[processOrder] Pedido ya existe refpcl=${ref}, codpcl=${pedidoId}`);
        }
        else {
            // 2) Actualizar stock
            try {
                for (const linea of order.lineas) {
                    yield (0, stockService_1.updateStock)(linea.artlpc, linea.canlpc);
                }
            }
            catch (err) {
                console.error('[processOrder] Error actualizando stock:', err);
                return res.status(500).json({ error: 'Error actualizando stock' });
            }
            // 3) Crear pedido en PostgreSQL + Access
            try {
                pedidoId = yield (0, orderService_1.createPedidoEnBases)(order.cabecera, order.lineas);
            }
            catch (err) {
                console.error('[processOrder] Error creando pedido:', err);
                return res.status(500).json({ error: 'No se pudo crear el pedido' });
            }
        }
        // 4) Escoger gateway según tipo
        const gateway = paymentMethodType === 'paypal' ? paypalGw : stripeGw;
        // 5) Procesar el pago
        try {
            // 5.1) Recuperar o crear customer
            let customerId;
            const existing = yield gateway.retrievePaymentMethod(paymentMethodId);
            if (existing === null || existing === void 0 ? void 0 : existing.customerId) {
                customerId = existing.customerId;
            }
            else {
                customerId = yield gateway.createCustomer({
                    name: shippingData.fullName,
                    email: shippingData.email,
                    phone: shippingData.phone
                });
                yield gateway.attachPaymentMethod(customerId, paymentMethodId);
            }
            // 5.2) Crear y confirmar pago
            const pi = yield gateway.createAndConfirmPayment(Math.round(order.cabecera.net1pcl * 100), 'EUR', {
                customerId,
                paymentMethodId,
                metadata: {
                    orderId: String(pedidoId),
                    email: shippingData.email,
                    phone: shippingData.phone,
                    shipMethod: shippingMethod,
                    shippingCost: String(shippingCost)
                }
            });
            // 5.3) Si requiere 3DS / acción adicional
            if (pi.status === 'requires_action') {
                return res.status(200).json({
                    requiresAction: true,
                    clientSecret: pi.clientSecret
                });
            }
            // 5.4) Pago OK
            return res.status(201).json({
                message: 'Pedido y pago procesados correctamente',
                pedidoId,
                paymentId: pi.id,
                rawResult: pi.raw
            });
        }
        catch (err) {
            console.error('[processOrder] Payment error:', err);
            return res.status(500).json({ error: 'Error procesando el pago' });
        }
    });
}
