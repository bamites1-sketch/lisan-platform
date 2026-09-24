FROM node:20-alpine
# Force rebuild for SQLite schema fix

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client with cache busting
RUN rm -rf node_modules/.prisma node_modules/@prisma/client 2>/dev/null || true
RUN npx prisma generate

# Build the application
RUN npm run build

# Create admin user script
RUN echo 'const { PrismaClient } = require("@prisma/client"); \
const bcrypt = require("bcrypt"); \
const prisma = new PrismaClient(); \
async function createAdmin() { \
  try { \
    const existing = await prisma.user.findUnique({ where: { email: "admin@readpath.com" } }); \
    if (existing) return console.log("Admin exists"); \
    const password = await bcrypt.hash("admin123456", 12); \
    const user = await prisma.user.create({ \
      data: { email: "admin@readpath.com", password, role: "ADMIN", status: "ACTIVE" } \
    }); \
    await prisma.admin.create({ \
      data: { userId: user.id, firstName: "Admin", lastName: "User" } \
    }); \
    console.log("Admin created"); \
  } catch (e) { console.log("Admin setup:", e.message); } \
  finally { await prisma.$disconnect(); } \
} \
createAdmin();' > create-admin-startup.js

# Expose port
EXPOSE 3000

# Start command
CMD ["sh", "-c", "node create-admin-startup.js; npm run start:prod"]