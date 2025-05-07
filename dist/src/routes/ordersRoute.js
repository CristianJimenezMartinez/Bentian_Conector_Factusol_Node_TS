"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ordersController_1 = require("../controllers/ordersController");
const orderRouter = (0, express_1.Router)();
// Ruta para crear un pedido (cabecera y líneas)
orderRouter.post('/orders', ordersController_1.createPedido);
exports.default = orderRouter;
