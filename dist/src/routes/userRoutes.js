"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const usersController_1 = require("../controllers/users/usersController");
const router = express_1.default.Router();
router.post('/createUser', usersController_1.createUser);
router.post('/login', usersController_1.loginUser);
router.put('/updateUser', usersController_1.updateUser);
exports.default = router;
