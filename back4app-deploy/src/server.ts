import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
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
import setupRoutes        from './routes/setup.routes';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(helmet.hsts({ maxAge: 60 * 60 * 24 * 365, includeSubDomains: true }));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://readpath-frontend.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

// Add FRONTEND_URL from env if it exists
if (process.env.FRONTEND_URL) {
  const envOrigins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
  allowedOrigins.push(...envOrigins);
}

console.log('🌐 Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, cb) => {
    console.log('CORS check - Origin:', origin, 'Allowed:', !origin || allowedOrigins.includes(origin));
    // Allow server-to-server calls (no origin) or whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    console.log('CORS rejected origin:', origin);
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

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ 
  status: 'ok', 
  message: 'ReadPath API is running',
  endpoints: ['/health', '/api/auth/login', '/api/setup/create-admin']
}));
app.get('/health', (_req, res) => res.json({ status: 'ok', message: 'ReadPath API is running' }));

// ─── Static file serving for local development ──────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Test page for audio playback (development only)
app.get('/test-audio-player.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'test-audio-player.html'));
});

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
app.use('/api/setup',          setupRoutes);                    // ONE-TIME admin creation

app.use(errorHandler);

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 ReadPath API running on port ${PORT}`);
    console.log(`📂 Database: ${process.env.DATABASE_URL}`);
  });
}

export default app;
