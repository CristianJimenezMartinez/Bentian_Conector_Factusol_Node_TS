"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoicesController_1 = require("../controllers/invoicesController");
const invoiceRouter = (0, express_1.Router)();
// Ruta para crear una factura (cabecera y líneas)
invoiceRouter.post('/invoices', invoicesController_1.createInvoice);
// Ruta para actualizar el estado de la factura (por ejemplo, tras el pago)
invoiceRouter.put('/invoices/status', invoicesController_1.updateFacturaEstado);
exports.default = invoiceRouter;
