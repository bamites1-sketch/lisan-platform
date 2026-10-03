"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const payment_controller_1 = require("../controllers/payment.controller");
const router = express_1.default.Router();
// Direct receipt image route (accessible to <img> tags & preview tabs by submission UUID)
router.get('/:id/receipt-image', payment_controller_1.getReceiptImage);
router.use(auth_1.authenticate);
// Student / Parent — submit and view their own submissions
router.post('/', (0, auth_1.authorize)('STUDENT', 'PARENT'), payment_controller_1.upload.single('receipt'), payment_controller_1.submitPayment);
router.get('/mine', (0, auth_1.authorize)('STUDENT', 'PARENT'), payment_controller_1.getMySubmissions);
// Admin — list all + approve/reject + view receipt
router.get('/', (0, auth_1.authorize)('ADMIN'), payment_controller_1.listAllPayments);
router.get('/:id/receipt', (0, auth_1.authorize)('ADMIN'), payment_controller_1.getReceiptUrl);
router.post('/:id/approve', (0, auth_1.authorize)('ADMIN'), payment_controller_1.approvePayment);
router.post('/:id/reject', (0, auth_1.authorize)('ADMIN'), payment_controller_1.rejectPayment);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map