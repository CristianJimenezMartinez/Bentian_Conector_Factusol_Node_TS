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
exports.PayPalGateway = void 0;
const checkout_server_sdk_1 = __importDefault(require("@paypal/checkout-server-sdk"));
class PayPalGateway {
    constructor(client) {
        this.client = client;
    }
    createCustomer(_info) {
        return __awaiter(this, void 0, void 0, function* () {
            // PayPal no implementa “customer” igual a Stripe
            return '';
        });
    }
    attachPaymentMethod(_customerId, _methodId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Nada que hacer, o guardar en tus propios metadatos
        });
    }
    retrievePaymentMethod(_methodId) {
        return __awaiter(this, void 0, void 0, function* () {
            // PayPal no tiene customer, devolvemos null
            return { customerId: null };
        });
    }
    createAndConfirmPayment(amount, currency, _opts) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1) Crear orden
            const orderReq = new checkout_server_sdk_1.default.orders.OrdersCreateRequest();
            orderReq.prefer('return=representation');
            orderReq.requestBody({
                intent: 'CAPTURE',
                purchase_units: [
                    { amount: { currency_code: currency, value: amount.toFixed(2) } },
                ],
            });
            const { result: order } = yield this.client.execute(orderReq);
            // 2) Capturar sin body
            const captureReq = new checkout_server_sdk_1.default.orders.OrdersCaptureRequest(order.id);
            captureReq.prefer('return=representation');
            const { result: capture } = yield this.client.execute(captureReq);
            return {
                id: capture.id,
                status: capture.status,
                raw: capture,
            };
        });
    }
    handleWebhookEvent(rawBody, _signature) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = JSON.parse(rawBody.toString());
            return { type: event.event_type, data: event.resource };
        });
    }
}
exports.PayPalGateway = PayPalGateway;
