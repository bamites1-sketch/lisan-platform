import express from 'express';
import { authenticate, authorize, requireActive } from '../middleware/auth';
import {
  getLearningPlan,
  getLesson,
  completeActivity,
  getLessons,
} from '../controllers/learning.controller';

const router = express.Router();
router.use(authenticate);
router.use(authorize('STUDENT'));
router.use(requireActive);

router.get('/plan',                       getLearningPlan);
router.get('/lessons',                    getLessons);
router.get('/lessons/:id',                getLesson);
router.post('/activities/:id/complete',   completeActivity);

export default router;
