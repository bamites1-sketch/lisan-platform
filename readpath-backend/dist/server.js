"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const assessment_routes_1 = __importDefault(require("./routes/assessment.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const learning_routes_1 = __importDefault(require("./routes/learning.routes"));
const practice_routes_1 = __importDefault(require("./routes/practice.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const parent_routes_1 = __importDefault(require("./routes/parent.routes"));
const teacher_routes_1 = __importDefault(require("./routes/teacher.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const recording_routes_1 = __importDefault(require("./routes/recording.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const contact_routes_1 = __importDefault(require("./routes/contact.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const setup_routes_1 = __importDefault(require("./routes/setup.routes"));
dotenv_1.default.config();
// ─── Fail-fast env checks in production ──────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
    const required = [
        ['DATABASE_URL', 'PostgreSQL connection string (from Render, Back4App, or your host)'],
        ['JWT_SECRET', 'Signing secret for access tokens (openssl rand -base64 64)'],
        ['JWT_REFRESH_SECRET', 'Signing secret for refresh tokens — MUST differ from JWT_SECRET'],
    ];
    const missing = required.filter(([k]) => !process.env[k]);
    if (missing.length > 0) {
        console.error('\n❌ Missing required production environment variables:');
        for (const [k, desc] of missing) {
            console.error(`   - ${k}  (${desc})`);
        }
        console.error('   Set the variables above in your host environment and redeploy.\n');
        process.exit(1);
    }
}
else {
    // Dev — warn only so developers don't get stuck.
    for (const k of ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET']) {
        if (!process.env[k]) {
            console.warn(`[dev] Warning: env var ${k} is not set — server will fail when that feature is used.`);
        }
    }
}
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// ─── Security Headers ─────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use(helmet_1.default.hsts({ maxAge: 60 * 60 * 24 * 365, includeSubDomains: true }));
// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    'https://readpath-frontend.vercel.app',
    'https://readpath-backend.vercel.app',
    'https://lisanplatform2-0my7f45h.b4a.run',
    'https://lisan-platform-backend.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
];
// Add FRONTEND_URL from env if it exists
if (process.env.FRONTEND_URL) {
    const envOrigins = process.env.FRONTEND_URL
        .split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    allowedOrigins.push(...envOrigins);
}
console.log('🌐 Allowed CORS origins:', allowedOrigins);
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        console.log('CORS check - Origin:', origin, 'Allowed:', !origin || allowedOrigins.includes(origin));
        // Allow server-to-server calls (no origin) or whitelisted origins
        if (!origin || allowedOrigins.includes(origin))
            return cb(null, true);
        console.log('CORS rejected origin:', origin);
        cb(new Error('CORS: origin not allowed'));
    },
    credentials: true, // required for HttpOnly cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express_1.default.json({ limit: '1mb' })); // cap JSON body size
app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
app.use((0, cookie_parser_1.default)()); // needed for HttpOnly refresh token
// ─── Rate Limiters ────────────────────────────────────────────────────────────
// Strict limiter for auth endpoints (login / register / refresh)
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
    skipSuccessfulRequests: false,
});
// Lighter limiter for all other API routes
const apiLimiter = (0, express_rate_limit_1.default)({
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
const uploadsDir = path_1.default.join(__dirname, '..', 'uploads');
app.use('/uploads', express_1.default.static(uploadsDir));
// Test page for audio playback (development only)
app.get('/test-audio-player.html', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'test-audio-player.html'));
});
// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, auth_routes_1.default);
app.use('/api/students', apiLimiter, student_routes_1.default);
app.use('/api/student', apiLimiter, student_routes_1.default);
app.use('/api/assessments', apiLimiter, assessment_routes_1.default);
app.use('/api/profiles', apiLimiter, profile_routes_1.default);
app.use('/api/learning', apiLimiter, learning_routes_1.default);
app.use('/api/practice', apiLimiter, practice_routes_1.default);
app.use('/api/chat', apiLimiter, chat_routes_1.default);
app.use('/api/parents', apiLimiter, parent_routes_1.default);
app.use('/api/teachers', apiLimiter, teacher_routes_1.default);
app.use('/api/admin', apiLimiter, admin_routes_1.default);
app.use('/api/recordings', apiLimiter, recording_routes_1.default);
app.use('/api/notifications', apiLimiter, notification_routes_1.default);
app.use('/api/contact', apiLimiter, contact_routes_1.default); // public — no auth
app.use('/api/payments', apiLimiter, payment_routes_1.default);
app.use('/api/setup', setup_routes_1.default); // ONE-TIME admin creation
app.use(errorHandler_1.errorHandler);
// Start the server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 ReadPath API running on port ${PORT}`);
        console.log(`📂 Database: ${process.env.DATABASE_URL}`);
    });
}
// Export for Vercel
exports.default = app;
//# sourceMappingURL=server.js.map