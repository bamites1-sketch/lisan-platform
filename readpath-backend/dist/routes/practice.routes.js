"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const practice_controller_1 = require("../controllers/practice.controller");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('STUDENT'));
router.use(auth_1.requireActive);
router.post('/start', practice_controller_1.startPractice);
router.post('/:id/responses', practice_controller_1.submitPracticeResponse);
router.post('/:id/complete', practice_controller_1.completePractice);
router.get('/history', practice_controller_1.getPracticeHistory);
exports.default = router;
//# sourceMappingURL=practice.routes.js.map