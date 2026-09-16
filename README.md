# LiSAN — Reading Diagnostic & Personalized Learning Platform

A full-stack web application for diagnosing student reading levels and delivering personalized learning plans. Built for schools in Ethiopia and beyond.

## Stack

- **Frontend** — React 18, TypeScript, Vite, Tailwind CSS
- **Backend** — Node.js, Express, TypeScript, Prisma ORM
- **Database** — SQLite (dev) / can be swapped for PostgreSQL
- **AI** — Google Gemini API (reading coach chatbot)

## Project Structure

```
abu-agency/
├── readpath-backend/    Express API + Prisma
└── readpath-frontend/   React + Vite SPA
```

## Getting Started

### 1. Backend

```bash
cd readpath-backend
npm install
cp .env.example .env        # fill in your values
npx prisma migrate dev       # run DB migrations
npm run dev                  # starts on port 5000
```

### 2. Frontend

```bash
cd readpath-frontend
npm install
npm run dev                  # starts on port 3000
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `readpath-backend/.env.example` for all required variables.

## Features

- Student reading diagnostic assessments
- AI-powered reading coach (Lemi) via Gemini API
- Personalized learning plans
- Teacher & admin dashboards
- Parent progress monitoring
- Payment submission workflow
- Notifications system
