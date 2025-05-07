import { Router } from 'express';
import { createPedido } from '../controllers/ordersController';

const orderRouter = Router();

// Ruta para crear un pedido (cabecera y líneas)
orderRouter.post('/orders', createPedido);

export default orderRouter;
