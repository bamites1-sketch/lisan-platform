"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const learning_controller_1 = require("../controllers/learning.controller");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('STUDENT'));
router.use(auth_1.requireActive);
router.get('/plan', learning_controller_1.getLearningPlan);
router.get('/lessons', learning_controller_1.getLessons);
router.get('/lessons/:id', learning_controller_1.getLesson);
router.post('/activities/:id/complete', learning_controller_1.completeActivity);
exports.default = router;
//# sourceMappingURL=learning.routes.js.map