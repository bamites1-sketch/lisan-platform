import express from 'express';
import { authenticate, authorize, requireActive } from '../middleware/auth';
import { 
  getDashboard, 
  updateProfile, 
  getProgressLogs, 
  getStudentAssignments,
  getStudentContent,
  getContentItem
  ,getStudentClasses
} from '../controllers/student.controller';

const router = express.Router();
router.use(authenticate);
router.use(authorize('STUDENT'));

// These two are accessible even without an active account
// (so PENDING students can see the payment wall with their info)
router.get('/dashboard',    getDashboard);
router.put('/profile',      updateProfile);

// Everything below requires an active (paid) account
router.get('/progress',     requireActive, getProgressLogs);
router.get('/assignments',  requireActive, getStudentAssignments);
router.get('/classes',      requireActive, getStudentClasses);
router.get('/content',      requireActive, getStudentContent);
router.get('/content/:type/:id', requireActive, getContentItem);

export default router;
