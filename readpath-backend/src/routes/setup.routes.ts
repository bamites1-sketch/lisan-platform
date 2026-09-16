import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const router = Router();
const prisma = new PrismaClient();

// ONE-TIME setup endpoint to create initial admin
router.post('/create-admin', async (req, res) => {
  try {
    // Check if any admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      return res.status(400).json({ 
        error: 'Admin already exists',
        email: existingAdmin.email 
      });
    }

    // Create admin user
    const password = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@lisan.com',
        password,
        role: 'ADMIN',
        admin: {
          create: {
            firstName: 'Admin',
            lastName: 'User'
          }
        }
      },
      include: { admin: true }
    });

    res.json({
      message: 'Admin created successfully!',
      credentials: {
        email: 'admin@lisan.com',
        password: 'admin123'
      }
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
