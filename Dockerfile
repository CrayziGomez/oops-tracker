# 1. Install ALL dependencies (build tools needed for compilation)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# 2. Install ONLY production dependencies (for the runtime image)
FROM node:20-alpine AS prod-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# 3. Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 4. Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    apk add --no-cache su-exec

# Standalone Next.js output (minimal traced app files)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Full production node_modules — avoids fragile selective copying of
# Prisma WASM files, tsx internals, etc. Devdependencies are excluded.
COPY --from=prod-deps /app/node_modules ./node_modules

# Prisma schema (needed by prisma db push at runtime)
COPY --from=builder /app/prisma ./prisma

# package.json needed so npm run db:seed resolves correctly
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p public/uploads /app/data && chown -R nextjs:nodejs public/uploads /app/data

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]
