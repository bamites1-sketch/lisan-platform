"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
function checkSetupKey(req, res) {
    const expectedKey = process.env.SETUP_KEY;
    if (!expectedKey)
        return true;
    const provided = (req.body && req.body.setupKey) || req.headers['x-setup-key'];
    if (provided !== expectedKey) {
        res.status(403).json({ error: 'Invalid setup key' });
        return false;
    }
    return true;
}
function resolveProjectRoot() {
    try {
        const prismaEntry = require.resolve('@prisma/client');
        const nodeModulesIdx = prismaEntry.lastIndexOf(path_1.default.sep + 'node_modules' + path_1.default.sep);
        if (nodeModulesIdx !== -1) {
            return prismaEntry.slice(0, nodeModulesIdx);
        }
    }
    catch (_) { }
    const candidates = [
        process.cwd(),
        path_1.default.join(process.cwd(), 'readpath-backend'),
        path_1.default.join(process.cwd(), '..'),
        path_1.default.join(process.cwd(), 'backend-deploy'),
        path_1.default.resolve(__dirname, '..', '..'),
    ];
    for (const c of candidates) {
        try {
            const pkg = path_1.default.join(c, 'package.json');
            if (fs_1.default.existsSync(pkg))
                return c;
        }
        catch (_) { }
    }
    return process.cwd();
}
function resolvePrismaCli(projectRoot) {
    try {
        const entry = require.resolve('prisma/build/index.js');
        if (fs_1.default.existsSync(entry))
            return entry;
    }
    catch (_) { }
    const localBin = path_1.default.join(projectRoot, 'node_modules', '.bin', 'prisma');
    if (fs_1.default.existsSync(localBin))
        return localBin;
    const viaPkg = path_1.default.join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js');
    if (fs_1.default.existsSync(viaPkg))
        return viaPkg;
    return 'prisma';
}
router.post('/migrate', async (req, res) => {
    if (!checkSetupKey(req, res))
        return;
    try {
        const projectRoot = resolveProjectRoot();
        const candidates = [
            path_1.default.join(projectRoot, 'prisma', 'schema.production.prisma'),
            path_1.default.join(projectRoot, 'prisma', 'schema.prisma'),
            path_1.default.join(process.cwd(), 'readpath-backend', 'prisma', 'schema.production.prisma'),
            path_1.default.join(process.cwd(), 'prisma', 'schema.production.prisma'),
        ];
        const schema = candidates.find((p) => {
            try {
                fs_1.default.accessSync(p);
                return true;
            }
            catch {
                return false;
            }
        }) || candidates[0];
        const prismaCli = resolvePrismaCli(projectRoot);
        const tmpDir = process.env.TMPDIR || process.env.TEMP || '/tmp';
        const childEnv = {
            ...process.env,
            HOME: tmpDir,
            TMPDIR: tmpDir,
            TEMP: tmpDir,
            TMP: tmpDir,
            NPM_CONFIG_CACHE: path_1.default.join(tmpDir, '_npm_cache'),
            PRISMA_HIDE_UPDATE_MESSAGE: '1',
            PRISMA_ENGINES_METRICS: '0',
        };
        const args = ['migrate', 'deploy', '--schema', schema];
        const nodeArgs = [prismaCli].concat(args);
        const child = (0, child_process_1.execFile)(process.execPath, nodeArgs, { cwd: projectRoot, timeout: 4 * 60 * 1000, maxBuffer: 2 * 1024 * 1024, env: childEnv }, (err, stdout, stderr) => {
            const output = (stdout || '') + '\n' + (stderr || '');
            if (err) {
                console.error('Migrate error:', err);
                return res.status(500).json({ success: false, error: err.message, output, schema, projectRoot, cwd: process.cwd() });
            }
            res.json({ success: true, message: 'Migrations applied (or already in sync).', output, schema, projectRoot });
        });
        child.on('error', (e) => {
            res.status(500).json({ success: false, error: 'Failed to spawn migrate command: ' + e.message, schema, projectRoot });
        });
    }
    catch (error) {
        console.error('Setup migrate error:', error);
        res.status(500).json({ error: error.message });
    }
});
router.get('/db-info', async (req, res) => {
    if (!checkSetupKey(req, res))
        return;
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
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/create-admin', async (req, res) => {
    try {
        if (!checkSetupKey(req, res))
            return;
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
        const hashed = await bcrypt_1.default.hash(password, 12);
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
    }
    catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=setup.routes.js.map