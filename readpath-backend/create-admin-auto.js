/**
 * Non-interactive admin creation script — env-var driven, idempotent.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@example.com \
 *   ADMIN_PASSWORD='Test1234' \
 *   ADMIN_FIRST_NAME='Abu' \
 *   ADMIN_LAST_NAME='Agency' \
 *   node create-admin-auto.js
 *
 * Requirements:
 *   - Run FROM the backend directory (readpath-backend/ or deploy copies) so
 *     Prisma client and dotenv load correctly.
 *   - Prisma Client MUST be generated first:  npx prisma generate --schema prisma/schema.production.prisma
 *   - DATABASE_URL env var must be set (will be loaded from .env if present).
 *
 * Idempotency:
 *   If any ADMIN user already exists in the database, the script exits 0 with
 *   a "already exists" message and does NOT create a second admin.
 *
 * Password policy (matches auth.controller.ts):
 *   >= 8 chars, at least one uppercase, one lowercase, one digit.
 */
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

function validatePassword(password) {
  if (typeof password !== 'string') return 'ADMIN_PASSWORD must be a string.';
  if (password.length < 8) return 'ADMIN_PASSWORD must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'ADMIN_PASSWORD must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'ADMIN_PASSWORD must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'ADMIN_PASSWORD must contain at least one number.';
  return null;
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function main() {
  const email     = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password  = process.env.ADMIN_PASSWORD || '';
  const firstName = (process.env.ADMIN_FIRST_NAME || '').trim();
  const lastName  = (process.env.ADMIN_LAST_NAME || '').trim();

  // --- Input validation (fail-fast, non-zero exit) ---
  if (!email || !password || !firstName || !lastName) {
    console.error('❌ Missing required env vars. All four must be non-empty:');
    console.error('   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME');
    process.exit(2);
  }
  if (!isValidEmail(email)) {
    console.error(`❌ ADMIN_EMAIL is not a valid email address: "${email}"`);
    process.exit(2);
  }
  const pwErr = validatePassword(password);
  if (pwErr) {
    console.error('❌', pwErr);
    process.exit(2);
  }

  // --- Idempotency check ---
  const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (existing) {
    console.log('✅ An admin user already exists:', existing.email);
    console.log('   Skipping creation. Use the admin dashboard to manage users.');
    process.exit(0);
  }

  // --- Create ---
  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: 'ADMIN',
      status: 'ACTIVE',
      admin: {
        create: { firstName, lastName },
      },
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log('   Email   :', email);
  console.log('   Name    :', firstName, lastName);
  console.log('   You can now log in at the frontend using these credentials.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error creating admin user:', err.message || err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
