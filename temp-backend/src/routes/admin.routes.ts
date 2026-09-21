import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getDashboard, getAllUsers, createContent, getAnalytics,
  getAssignments, createAssignment, updateAssignment, deleteAssignment,
  getPassages, getQuestions, getVocabulary, getLessons, getAssessments, getPDFResources, 
  uploadPDFResource, trackDownload, getResourceDownloadUrl, deleteContent, updateContent, upload,
  getStudents, getTeachers, getParents, createUser, deleteUser, getClasses, createClass, assignClassStudents, deleteClass,
} from '../controllers/admin.controller';
import {
  createAssessment,
  getAllAssessments as getAdminAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
  assignAssessment,
  getStudentsForAssignment,
  getTeachersForAssignment,
  getGradesForAssignment,
  getSubmissionsForReview,
  getSubmissionForReview,
  scoreSubmission
} from '../controllers/assessment.controller';

const router = express.Router();
router.use(authenticate);
router.use(authorize('ADMIN'));

// Dashboard & analytics
router.get('/dashboard',  getDashboard);
router.get('/analytics',  getAnalytics);

// Users
router.get('/users',           getAllUsers);
router.get('/students',        getStudents);
router.get('/teachers',        getTeachers);
router.get('/parents',         getParents);
router.post('/users',          createUser);
router.delete('/users/:id',    deleteUser);
router.get('/classes',         getClasses);
router.post('/classes',        createClass);
router.post('/classes/:id/students', assignClassStudents);
router.delete('/classes/:id',  deleteClass);

// Content CRUD
router.post('/content',              createContent);
router.put('/content/:type/:id',      updateContent);
router.get('/content/passages',      getPassages);
router.get('/content/questions',     getQuestions);
router.get('/content/vocabulary',    getVocabulary);
router.get('/content/lessons',       getLessons);
router.get('/content/assessments',   getAssessments);
router.get('/content/pdf-resources', getPDFResources);
router.post('/upload/pdf-resource',  upload.single('file'), uploadPDFResource);
router.get('/content/pdf-resource/:id/download', getResourceDownloadUrl);
router.post('/content/pdf-resource/:id/track', trackDownload);
router.delete('/content/:type/:id',  deleteContent);

// Assignments
router.get('/assignments',       getAssignments);
router.post('/assignments',      createAssignment);
router.put('/assignments/:id',   updateAssignment);
router.delete('/assignments/:id', deleteAssignment);

// LISAN Assessments
router.post('/assessments',                    createAssessment);
router.get('/assessments',                     getAdminAssessments);
router.get('/assessments/:id',                 getAssessment);
router.put('/assessments/:id',                 updateAssessment);
router.delete('/assessments/:id',              deleteAssessment);
router.post('/assessments/:id/assign',         assignAssessment);

// Assessment assignment helpers
router.get('/assessments/helpers/students',    getStudentsForAssignment);
router.get('/assessments/helpers/teachers',    getTeachersForAssignment);
router.get('/assessments/helpers/grades',      getGradesForAssignment);

// Assessment review
router.get('/assessments/submissions/review',  getSubmissionsForReview);
router.get('/assessments/submissions/:id',     getSubmissionForReview);
router.put('/assessments/submissions/:id/score', scoreSubmission);

export default router;
