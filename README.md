# ReadPath - Reading Diagnostic & Personalized Learning Platform

**Status**: ✅ **LIVE & OPERATIONAL**

A comprehensive web-based platform for reading assessment, personalized learning plans, and student progress tracking.

---

## 🌐 Live Production

- **Frontend**: https://readpath-frontend.vercel.app
- **Backend API**: https://readpath-backend.vercel.app
- **Status**: All systems operational ✅

---

## Features

### For Students
- ✅ Comprehensive reading assessments (fluency, accuracy, comprehension)
- ✅ Personalized learning plans based on assessment results
- ✅ Interactive practice sessions with immediate feedback
- ✅ Progress tracking and performance analytics
- ✅ Gamification (XP, levels, badges, streaks)
- ✅ Voice recording for fluency assessments
- ✅ AI-powered chat tutor for learning support

### For Parents
- ✅ Monitor child's progress and performance
- ✅ View assessment results and feedback
- ✅ Track learning activities and completion
- ✅ Receive notifications about child's milestones
- ✅ Submit feedback and communicate with teachers/admin

### For Teachers
- ✅ Assign assessments to students
- ✅ Review and grade student submissions
- ✅ Provide detailed feedback on assessments
- ✅ Track student progress across skill areas
- ✅ Manage classes and student groups
- ✅ Export student reports

### For Administrators
- ✅ Complete platform management dashboard
- ✅ User management (students, parents, teachers, admins)
- ✅ Content management (passages, questions, lessons, vocabulary)
- ✅ Assessment creation and assignment
- ✅ Payment processing and package management
- ✅ System analytics and reporting
- ✅ Notification system

---

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Hosting**: Vercel

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: JWT (access + refresh tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Hosting**: Vercel Serverless Functions

---

## Project Structure

```
abu-agency/
├── readpath-frontend/         # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components (routes)
│   │   ├── contexts/         # React contexts (auth, etc.)
│   │   ├── types/            # TypeScript type definitions
│   │   └── App.tsx           # Main app component
│   ├── public/               # Static assets
│   └── package.json
│
├── readpath-backend/          # Express backend API
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth, error handling, etc.
│   │   ├── lib/              # Utilities (Prisma, storage)
│   │   └── server.ts         # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── migrations/       # Database migrations
│   ├── api/
│   │   └── index.js          # Vercel serverless entry
│   └── package.json
│
├── DEPLOYMENT.md              # Deployment guide
├── SECURITY.md                # Security policy
└── README.md                  # This file
```

---

## Getting Started

### Default Admin Credentials

```
Email: admin@lisan.com
Password: LiSAN2026!
```

**⚠️ IMPORTANT**: Change these credentials immediately after first login!

### Creating Additional Users

1. **Students/Parents**: Register via the signup page
2. **Teachers**: Admin creates teacher accounts
3. **Admins**: Admin creates additional admin accounts

---

## Development

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Vercel CLI (optional, for deployments)

### Setup Local Development

```bash
# Clone repository
git clone https://github.com/bamites1-sketch/lisan-platform.git
cd abu-agency

# Backend setup
cd readpath-backend
npm install
cp .env.example .env
# Edit .env with your local database URL
npx prisma migrate dev
npx prisma generate
npm run dev

# Frontend setup (new terminal)
cd readpath-frontend
npm install
cp .env.example .env
# Edit .env with your local backend URL
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

---

## Deployment

### Automatic Deployment (Configured) ✅

Both frontend and backend automatically deploy to Vercel when you push to the `main` branch.

### Manual Deployment

```bash
# Deploy backend
cd readpath-backend
vercel --prod

# Deploy frontend
cd readpath-frontend
vercel --prod
```

**Full deployment guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Security

### Security Measures
- ✅ HTTPS enforced on all connections
- ✅ JWT authentication with refresh tokens
- ✅ HttpOnly cookies for refresh token storage
- ✅ bcrypt password hashing
- ✅ CORS protection with whitelist
- ✅ Rate limiting on all API endpoints
- ✅ SQL injection protection (Prisma ORM)
- ✅ XSS protection (Helmet security headers)
- ✅ Database connection over SSL

**Full security policy**: See [SECURITY.md](./SECURITY.md)

---

## Monitoring

### Health Check
```bash
curl https://readpath-backend.vercel.app/health
```

### View Logs
```bash
# Backend logs
cd readpath-backend
vercel logs --prod

# Frontend logs
cd readpath-frontend
vercel logs --prod
```

---

## API Documentation

### Base URL
```
https://readpath-backend.vercel.app
```

### Key Endpoints

**Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

**Assessments**
- `GET /api/assessments` - List assessments
- `POST /api/assessments` - Create assessment (admin)
- `POST /api/assessments/:id/submit` - Submit assessment
- `GET /api/assessments/submissions` - Get submissions

**Student**
- `GET /api/students/dashboard` - Student dashboard data
- `GET /api/students/profile` - Student profile
- `GET /api/students/progress` - Learning progress

**Admin**
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - User management
- `POST /api/admin/content` - Content management

**All endpoints require authentication** (except `/auth/register` and `/auth/login`)

---

## Support

### Troubleshooting

**Login fails with 500 error**
- Check database connection in Vercel environment variables
- Verify `DATABASE_URL` is correctly set

**CORS errors**
- Ensure `FRONTEND_URL` in backend matches your frontend URL
- Check CORS whitelist in `src/server.ts`

**For more help**: See [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)

---

## License

Proprietary - All rights reserved

---

## Project Status

✅ **PRODUCTION-READY**  
✅ **SECURED & DEPLOYED**  
✅ **FULLY OPERATIONAL**

**Last Updated**: September 24, 2026  
**Version**: 1.0.0
