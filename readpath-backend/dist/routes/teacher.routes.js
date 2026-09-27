"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const teacher_controller_1 = require("../controllers/teacher.controller");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('TEACHER'));
router.get('/students', teacher_controller_1.getStudents);
router.get('/students/:id', teacher_controller_1.getStudentDetail);
router.get('/analytics', teacher_controller_1.getClassAnalytics);
exports.default = router;
//# sourceMappingURL=teacher.routes.js.map