import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import authRoutes       from './routes/auth.routes';
import studentRoutes    from './routes/student.routes';
import assessmentRoutes from './routes/assessment.routes';
import profileRoutes    from './routes/profile.routes';
import learningRoutes   from './routes/learning.routes';
import practiceRoutes   from './routes/practice.routes';
import chatRoutes       from './routes/chat.routes';
import parentRoutes     from './routes/parent.routes';
import teacherRoutes    from './routes/teacher.routes';
import adminRoutes      from './routes/admin.routes';
import recordingRoutes  from './routes/recording.routes';
import notificationRoutes from './routes/notification.routes';
import contactRoutes      from './routes/contact.routes';
import paymentRoutes      from './routes/payment.routes';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(helmet.hsts({ maxAge: 60 * 60 * 24 * 365, includeSubDomains: true }));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server calls (no origin) in dev; reject unknown origins in prod
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,          // required for HttpOnly cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));          // cap JSON body size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());                          // needed for HttpOnly refresh token

// ─── Rate Limiters ────────────────────────────────────────────────────────────

// Strict limiter for auth endpoints (login / register / refresh)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
  skipSuccessfulRequests: false,
});

// Lighter limiter for all other API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  skipSuccessfulRequests: true,
});

// ─── Static files (uploaded audio) ───────────────────────────────────────────
// Serve under /uploads but strip directory listing via express.static options
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  index: false,          // disable directory listing
  dotfiles: 'deny',
}));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', message: 'ReadPath API is running' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',        authLimiter,  authRoutes);
app.use('/api/students',    apiLimiter,   studentRoutes);
app.use('/api/assessments', apiLimiter,   assessmentRoutes);
app.use('/api/profiles',    apiLimiter,   profileRoutes);
app.use('/api/learning',    apiLimiter,   learningRoutes);
app.use('/api/practice',    apiLimiter,   practiceRoutes);
app.use('/api/chat',        apiLimiter,   chatRoutes);
app.use('/api/parents',     apiLimiter,   parentRoutes);
app.use('/api/teachers',    apiLimiter,   teacherRoutes);
app.use('/api/admin',       apiLimiter,   adminRoutes);
app.use('/api/recordings',     apiLimiter,   recordingRoutes);
app.use('/api/notifications',  apiLimiter,   notificationRoutes);
app.use('/api/contact',        apiLimiter,   contactRoutes);   // public — no auth
app.use('/api/payments',       apiLimiter,   paymentRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 ReadPath API running on port ${PORT}`);
  console.log(`📂 Database: ${process.env.DATABASE_URL}`);
});

export default app;
