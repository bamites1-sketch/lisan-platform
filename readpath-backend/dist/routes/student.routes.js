"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const student_controller_1 = require("../controllers/student.controller");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('STUDENT'));
// Accessible even without an active account
router.get('/dashboard', student_controller_1.getDashboard);
router.put('/profile', student_controller_1.updateProfile);
// Learning materials & study resources
router.get('/resources', student_controller_1.getStudentResources);
router.get('/resources/:id/download', student_controller_1.getStudentResourceDownloadUrl);
// Everything below requires an active (paid) account
router.get('/progress', auth_1.requireActive, student_controller_1.getProgressLogs);
router.get('/assignments', auth_1.requireActive, student_controller_1.getStudentAssignments);
router.get('/classes', auth_1.requireActive, student_controller_1.getStudentClasses);
router.get('/content', auth_1.requireActive, student_controller_1.getStudentContent);
router.get('/content/:type/:id', auth_1.requireActive, student_controller_1.getContentItem);
exports.default = router;
//# sourceMappingURL=student.routes.js.map