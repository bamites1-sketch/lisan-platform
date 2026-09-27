"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const admin_controller_1 = require("../controllers/admin.controller");
const assessment_controller_1 = require("../controllers/assessment.controller");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('ADMIN'));
// Dashboard & analytics
router.get('/dashboard', admin_controller_1.getDashboard);
router.get('/analytics', admin_controller_1.getAnalytics);
// Admin Profile
router.put('/profile', admin_controller_1.updateAdminProfile);
// Users
router.get('/users', admin_controller_1.getAllUsers);
router.get('/students', admin_controller_1.getStudents);
router.get('/teachers', admin_controller_1.getTeachers);
router.get('/parents', admin_controller_1.getParents);
router.post('/users', admin_controller_1.createUser);
router.patch('/users/:id/status', admin_controller_1.updateUserStatus);
router.delete('/users/:id', admin_controller_1.deleteUser);
router.get('/classes', admin_controller_1.getClasses);
router.post('/classes', admin_controller_1.createClass);
router.post('/classes/:id/students', admin_controller_1.assignClassStudents);
router.delete('/classes/:id', admin_controller_1.deleteClass);
// Content CRUD
router.post('/content', admin_controller_1.createContent);
router.put('/content/:type/:id', admin_controller_1.updateContent);
router.get('/content/passages', admin_controller_1.getPassages);
router.get('/content/questions', admin_controller_1.getQuestions);
router.get('/content/vocabulary', admin_controller_1.getVocabulary);
router.get('/content/lessons', admin_controller_1.getLessons);
router.get('/content/assessments', admin_controller_1.getAssessments);
router.get('/content/pdf-resources', admin_controller_1.getPDFResources);
router.post('/upload/pdf-resource', admin_controller_1.upload.single('file'), admin_controller_1.uploadPDFResource);
router.get('/content/pdf-resource/:id/download', admin_controller_1.getResourceDownloadUrl);
router.post('/content/pdf-resource/:id/track', admin_controller_1.trackDownload);
router.delete('/content/:type/:id', admin_controller_1.deleteContent);
// Assignments
router.get('/assignments', admin_controller_1.getAssignments);
router.post('/assignments', admin_controller_1.createAssignment);
router.put('/assignments/:id', admin_controller_1.updateAssignment);
router.delete('/assignments/:id', admin_controller_1.deleteAssignment);
// LISAN Assessments
router.post('/assessments', assessment_controller_1.createAssessment);
router.get('/assessments', assessment_controller_1.getAllAssessments);
router.get('/assessments/:id', assessment_controller_1.getAssessment);
router.put('/assessments/:id', assessment_controller_1.updateAssessment);
router.delete('/assessments/:id', assessment_controller_1.deleteAssessment);
router.post('/assessments/:id/assign', assessment_controller_1.assignAssessment);
// Assessment assignment helpers
router.get('/assessments/helpers/students', assessment_controller_1.getStudentsForAssignment);
router.get('/assessments/helpers/teachers', assessment_controller_1.getTeachersForAssignment);
router.get('/assessments/helpers/grades', assessment_controller_1.getGradesForAssignment);
// Assessment review
router.get('/assessments/submissions/review', assessment_controller_1.getSubmissionsForReview);
router.get('/assessments/submissions/:id', assessment_controller_1.getSubmissionForReview);
router.put('/assessments/submissions/:id/score', assessment_controller_1.scoreSubmission);
// Voice recordings - get all assessment submissions with audio
router.get('/recordings', admin_controller_1.getAllRecordingSubmissions);
// Review recording submission
router.post('/recordings/:id/review', admin_controller_1.reviewRecordingSubmission);
// Get audio URL for recording submission
router.get('/recordings/:id/audio', admin_controller_1.getRecordingSubmissionAudioUrl);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map