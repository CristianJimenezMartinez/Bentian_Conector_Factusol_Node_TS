"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/paymentRoute.ts
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const paymentRouter = (0, express_1.Router)();
// POST /api/payment          → notification
paymentRouter.post('/', (req, res, next) => {
    console.log('[paymentRouter] POST /api/payment', req.body);
    next();
}, paymentController_1.paymentNotification);
// POST /api/payment/orders   → processOrder
paymentRouter.post('/orders', (req, res, next) => {
    console.log('[paymentRouter] POST /api/payment/orders', req.body);
    next();
}, paymentController_1.processOrder);
exports.default = paymentRouter;
