"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const notification_controller_1 = require("../controllers/notification.controller");
const router = express_1.default.Router();
router.use(auth_1.authenticate); // all notification routes require auth
router.get('/', notification_controller_1.getNotifications);
router.get('/unread-count', notification_controller_1.getUnreadCount);
router.patch('/read-all', notification_controller_1.markAllRead);
router.patch('/:id/read', notification_controller_1.markRead);
router.delete('/clear-all', notification_controller_1.clearAll);
router.delete('/:id', notification_controller_1.deleteNotification);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map