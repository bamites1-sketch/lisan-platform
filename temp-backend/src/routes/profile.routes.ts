import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getReadingProfile, getProfileHistory } from '../controllers/profile.controller';

const router = express.Router();

router.use(authenticate);

router.get('/current', authorize('STUDENT'), getReadingProfile);
router.get('/history', authorize('STUDENT'), getProfileHistory);

export default router;
