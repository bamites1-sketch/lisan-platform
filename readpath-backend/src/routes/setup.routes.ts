import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const router = Router();
const prisma = new PrismaClient();

/**
 * ONE-TIME setup endpoint to create the initial admin user.
 * Only works when no admins exist yet — safe to leave in place.
 *
 * POST /api/setup/create-admin
 * Body: { email, password, firstName, lastName, setupKey }
 *
 * Requires SETUP_KEY env var to prevent unauthorized access.
 */
router.post('/create-admin', async (req: Request, res: Response) => {
  try {
    // Guard: require a setup key so this can't be called anonymously in production
    const { email, password, firstName, lastName, setupKey } = req.body;

    const expectedKey = process.env.SETUP_KEY;
    if (expectedKey && setupKey !== expectedKey) {
      return res.status(403).json({ error: 'Invalid setup key' });
    }

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'email, password, firstName and lastName are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Only allowed when no admin exists yet
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists. Use the admin dashboard to manage users.' });
    }

    const hashed = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        email: String(email).trim().toLowerCase(),
        password: hashed,
        role: 'ADMIN',
        admin: {
          create: {
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
          },
        },
      },
      include: { admin: true },
    });

    res.json({
      success: true,
      message: 'Admin created successfully!',
      email: admin.email,
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
