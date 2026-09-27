"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.post('/refresh', auth_controller_1.refreshToken); // issues a new access token via HttpOnly refresh cookie
router.post('/logout', auth_controller_1.logout); // clears the refresh cookie
router.get('/me', auth_1.authenticate, auth_controller_1.getCurrentUser);
router.put('/change-password', auth_1.authenticate, auth_controller_1.changePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map