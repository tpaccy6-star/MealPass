# Multi-stage Dockerfile for NEXA MealPass
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN npm install

# Copy source
COPY . .

# Build frontend and backend
RUN npm run build

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/server.js"]
