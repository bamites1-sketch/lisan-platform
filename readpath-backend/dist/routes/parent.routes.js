"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const parent_controller_1 = require("../controllers/parent.controller");
const feedback_controller_1 = require("../controllers/feedback.controller");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('PARENT'));
router.get('/children', parent_controller_1.getChildrenProgress);
router.get('/children/:id', parent_controller_1.getChildDetail);
// Parent Feedback
router.post('/feedback', feedback_controller_1.createParentFeedback);
router.get('/feedback', feedback_controller_1.getMyParentFeedbacks);
exports.default = router;
//# sourceMappingURL=parent.routes.js.map