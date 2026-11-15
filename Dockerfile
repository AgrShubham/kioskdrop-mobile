# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci || npm install

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/prisma/dev.db"

# Generate client, sync schema, seed database, and create seed backup template
RUN npx prisma generate
RUN npx prisma db push --skip-generate
RUN npx tsx prisma/seed.ts
RUN cp prisma/dev.db prisma/dev-seed.db
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/prisma/dev.db"
ENV SESSION_SECRET="kioskdrop-production-session-secret-key-32chars"
ENV SERVER_PIN_PEPPER="kioskdrop-production-pin-pepper-entropy-32chars"
ENV WEBHOOK_SIGNING_SECRET="kioskdrop-production-webhook-signing-secret"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone bundle (no public/ directory in this repo)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Create directory for SQLite database with proper permissions
RUN mkdir -p /app/prisma && chown -R nextjs:nodejs /app/prisma

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
