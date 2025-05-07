"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// webhookRoutes.ts
const express_1 = require("express");
const webhookController_1 = require("../controllers/webhookController");
const body_parser_1 = __importDefault(require("body-parser"));
const router = (0, express_1.Router)();
// Stripe requiere el cuerpo en crudo para el webhook
router.post('/webhook', body_parser_1.default.raw({ type: 'application/json' }), webhookController_1.stripeWebhookHandler);
exports.default = router;
