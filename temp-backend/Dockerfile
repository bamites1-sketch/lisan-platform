# Use Node.js 20 Alpine for AWS SDK compatibility
FROM node:20-alpine

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Install dependencies first (for better layer caching)
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copy source code
COPY . .

# Make startup script executable
RUN chmod +x scripts/start.sh

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["./scripts/start.sh"]