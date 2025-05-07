// src/routes/paymentRoute.ts
import { Router } from 'express';
import { paymentNotification, processOrder } from '../controllers/paymentController';

const paymentRouter = Router();

// POST /api/payment          → notification
paymentRouter.post(
  '/',
  (req, res, next) => {
    console.log('[paymentRouter] POST /api/payment', req.body);
    next();
  },
  paymentNotification
);

// POST /api/payment/orders   → processOrder
paymentRouter.post(
  '/orders',
  (req, res, next) => {
    console.log('[paymentRouter] POST /api/payment/orders', req.body);
    next();
  },
  processOrder
);

export default paymentRouter;
