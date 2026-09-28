# ============ BUILD STAGE ============
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# ============ PRODUCTION STAGE ============
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

# Copy built app AND node_modules from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs

EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5173 || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "preview", "--", "--port", "5173"]