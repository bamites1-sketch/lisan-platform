import express from 'express';
import { authenticate, authorize, requireActive } from '../middleware/auth';
import { 
  getDashboard, 
  updateProfile, 
  getProgressLogs, 
  getStudentAssignments,
  getStudentContent,
  getContentItem,
  getStudentClasses,
  getStudentResources,
  getStudentResourceDownloadUrl
} from '../controllers/student.controller';

const router = express.Router();
router.use(authenticate);
router.use(authorize('STUDENT'));

// Accessible even without an active account
router.get('/dashboard',    getDashboard);
router.put('/profile',      updateProfile);

// Learning materials & study resources
router.get('/resources',                 getStudentResources);
router.get('/resources/:id/download',    getStudentResourceDownloadUrl);

// Everything below requires an active (paid) account
router.get('/progress',     requireActive, getProgressLogs);
router.get('/assignments',  requireActive, getStudentAssignments);
router.get('/classes',      requireActive, getStudentClasses);
router.get('/content',      requireActive, getStudentContent);
router.get('/content/:type/:id', requireActive, getContentItem);

export default router;
