import express from 'express';
import { register, login, refreshToken, logout, changePassword, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/register',         register);
router.post('/login',            login);
router.post('/refresh',          refreshToken);        // issues a new access token via HttpOnly refresh cookie
router.post('/logout',           logout);              // clears the refresh cookie
router.get('/me',                authenticate, getCurrentUser);
router.put('/change-password',   authenticate, changePassword);

export default router;
