import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getStudents, getStudentDetail, getClassAnalytics } from '../controllers/teacher.controller';

const router = express.Router();
router.use(authenticate);
router.use(authorize('TEACHER'));

router.get('/students',      getStudents);
router.get('/students/:id',  getStudentDetail);
router.get('/analytics',     getClassAnalytics);

export default router;
