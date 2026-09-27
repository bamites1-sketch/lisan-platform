"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const chat_controller_1 = require("../controllers/chat.controller");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('STUDENT'));
router.post('/messages', chat_controller_1.sendMessage);
router.get('/history', chat_controller_1.getChatHistory);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map