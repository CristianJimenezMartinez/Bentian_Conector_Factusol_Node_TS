import { Router } from 'express';
import { createInvoice, updateFacturaEstado } from '../controllers/invoicesController';

const invoiceRouter = Router();

// Ruta para crear una factura (cabecera y líneas)
invoiceRouter.post('/invoices', createInvoice);

// Ruta para actualizar el estado de la factura (por ejemplo, tras el pago)
invoiceRouter.put('/invoices/status', updateFacturaEstado);

export default invoiceRouter;
