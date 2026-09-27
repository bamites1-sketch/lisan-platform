"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const assessment_controller_1 = require("../controllers/assessment.controller");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('STUDENT'));
// Diagnostic assessment flow
router.post('/start', assessment_controller_1.startDiagnosticAssessment);
router.get('/history/all', assessment_controller_1.getStudentAssessmentHistory);
router.get('/:id/questions', assessment_controller_1.getAssessmentQuestions);
router.post('/:id/responses', assessment_controller_1.submitAssessmentResponse);
router.post('/:id/complete', assessment_controller_1.completeAssessment);
// General student assessment endpoints — accessible to all assigned students
router.get('/', assessment_controller_1.getStudentAssessments);
router.get('/:id', assessment_controller_1.getAssessmentForStudent);
router.post('/:id/submit', assessment_controller_1.upload.single('audio'), assessment_controller_1.submitAssessmentRecording);
router.get('/:assessmentId/result/:submissionId', assessment_controller_1.getAssessmentResult);
exports.default = router;
//# sourceMappingURL=assessment.routes.js.map