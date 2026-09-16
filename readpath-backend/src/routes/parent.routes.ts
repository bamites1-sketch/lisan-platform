import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getChildrenProgress, getChildDetail } from '../controllers/parent.controller';

const router = express.Router();

router.use(authenticate);
router.use(authorize('PARENT'));

router.get('/children', getChildrenProgress);
router.get('/children/:id', getChildDetail);

export default router;
