// webhookRoutes.ts
import { Router } from 'express';
import { stripeWebhookHandler } from '../controllers/webhookController';
import bodyParser from 'body-parser';

const router = Router();

// Stripe requiere el cuerpo en crudo para el webhook
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), stripeWebhookHandler);

export default router;
