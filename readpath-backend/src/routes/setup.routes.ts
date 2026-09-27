import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

function checkSetupKey(req: Request, res: Response): boolean {
  const expectedKey = process.env.SETUP_KEY;
  if (!expectedKey) return true;
  const provided = (req.body && req.body.setupKey) || req.headers['x-setup-key'];
  if (provided !== expectedKey) {
    res.status(403).json({ error: 'Invalid setup key' });
    return false;
  }
  return true;
}

function resolveProjectRoot(): string {
  try {
    const prismaEntry = require.resolve('@prisma/client');
    const nodeModulesIdx = prismaEntry.lastIndexOf(path.sep + 'node_modules' + path.sep);
    if (nodeModulesIdx !== -1) {
      return prismaEntry.slice(0, nodeModulesIdx);
    }
  } catch (_) {}
  const candidates = [
    process.cwd(),
    path.join(process.cwd(), 'readpath-backend'),
    path.join(process.cwd(), '..'),
    path.join(process.cwd(), 'backend-deploy'),
    path.resolve(__dirname, '..', '..'),
  ];
  for (const c of candidates) {
    try {
      const pkg = path.join(c, 'package.json');
      if (fs.existsSync(pkg)) return c;
    } catch (_) {}
  }
  return process.cwd();
}

function resolvePrismaCli(projectRoot: string): string {
  try {
    const entry = require.resolve('prisma/build/index.js');
    if (fs.existsSync(entry)) return entry;
  } catch (_) {}
  const localBin = path.join(projectRoot, 'node_modules', '.bin', 'prisma');
  if (fs.existsSync(localBin)) return localBin;
  const viaPkg = path.join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js');
  if (fs.existsSync(viaPkg)) return viaPkg;
  return 'prisma';
}

router.post('/migrate', async (req: Request, res: Response) => {
  if (!checkSetupKey(req, res)) return;
  try {
    const projectRoot = resolveProjectRoot();
    const candidates = [
      path.join(projectRoot, 'prisma', 'schema.production.prisma'),
      path.join(projectRoot, 'prisma', 'schema.prisma'),
      path.join(process.cwd(), 'readpath-backend', 'prisma', 'schema.production.prisma'),
      path.join(process.cwd(), 'prisma', 'schema.production.prisma'),
    ];
    const schema = candidates.find((p) => {
      try { fs.accessSync(p); return true; } catch { return false; }
    }) || candidates[0];

    const prismaCli = resolvePrismaCli(projectRoot);
    const tmpDir = process.env.TMPDIR || process.env.TEMP || '/tmp';

    const childEnv: NodeJS.ProcessEnv = {
      ...process.env,
      HOME: tmpDir,
      TMPDIR: tmpDir,
      TEMP: tmpDir,
      TMP: tmpDir,
      NPM_CONFIG_CACHE: path.join(tmpDir, '_npm_cache'),
      PRISMA_HIDE_UPDATE_MESSAGE: '1',
      PRISMA_ENGINES_METRICS: '0',
    };

    const args: string[] = ['migrate', 'deploy', '--schema', schema];
    const nodeArgs: string[] = [prismaCli].concat(args);

    const child = execFile(
      process.execPath,
      nodeArgs,
      { cwd: projectRoot, timeout: 4 * 60 * 1000, maxBuffer: 2 * 1024 * 1024, env: childEnv },
      (err, stdout, stderr) => {
        const output = (stdout || '') + '\n' + (stderr || '');
        if (err) {
          console.error('Migrate error:', err);
          return res.status(500).json({ success: false, error: err.message, output, schema, projectRoot, cwd: process.cwd() });
        }
        res.json({ success: true, message: 'Migrations applied (or already in sync).', output, schema, projectRoot });
      }
    );
    child.on('error', (e) => {
      res.status(500).json({ success: false, error: 'Failed to spawn migrate command: ' + e.message, schema, projectRoot });
    });
  } catch (error: any) {
    console.error('Setup migrate error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/db-info', async (req: Request, res: Response) => {
  if (!checkSetupKey(req, res)) return;
  try {
    const raw = process.env.DATABASE_URL || '';
    const prefix = raw.slice(0, 15);
    const len = raw.length;
    const projectRoot = resolveProjectRoot();
    res.json({
      prefix,
      length: len,
      startsPostgres: raw.startsWith('postgres://'),
      startsPostgresql: raw.startsWith('postgresql://'),
      hasQuotes: raw.startsWith('"') || raw.startsWith("'"),
      hasWhitespace: /^\s|\s$/.test(raw),
      projectRoot,
      cwd: process.cwd(),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/create-admin', async (req: Request, res: Response) => {
  try {
    if (!checkSetupKey(req, res)) return;
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'email, password, firstName and lastName are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

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
