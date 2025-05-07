"use strict";
// src/payment/StripeGateway.ts
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
exports.StripeGateway = void 0;
class StripeGateway {
    constructor(stripe, webhookSecret) {
        this.stripe = stripe;
        this.webhookSecret = webhookSecret;
    }
    createCustomer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const cust = yield this.stripe.customers.create({
                email: data.email,
                name: data.name,
                phone: data.phone,
                metadata: {},
            });
            return cust.id;
        });
    }
    attachPaymentMethod(customerId, methodId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.stripe.paymentMethods.attach(methodId, {
                customer: customerId,
            });
        });
    }
    retrievePaymentMethod(methodId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const pm = yield this.stripe.paymentMethods.retrieve(methodId);
            return { customerId: (_a = pm.customer) !== null && _a !== void 0 ? _a : null };
        });
    }
    createAndConfirmPayment(amount, currency, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const pi = yield this.stripe.paymentIntents.create({
                amount,
                currency,
                customer: opts.customerId,
                payment_method: opts.paymentMethodId,
                confirmation_method: 'manual',
                confirm: true,
                // ← Forzamos solo pagos con tarjeta, sin redirecciones
                payment_method_types: ['card'],
                metadata: opts.metadata,
            });
            return {
                id: pi.id,
                status: pi.status,
                clientSecret: (_a = pi.client_secret) !== null && _a !== void 0 ? _a : '',
                raw: pi,
            };
        });
    }
    handleWebhookEvent(rawBody, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
            return { type: event.type, data: event.data.object };
        });
    }
}
exports.StripeGateway = StripeGateway;
