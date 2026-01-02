# 🐳 TAREA 25: Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies strictly
RUN npm ci --only=production

# Copy source code (respecting .dockerignore)
COPY . .

# Run build if necessary (Wait, we usually build outside or use multi-stage)
# Since we have webpack, let's include devDeps to build or use pre-built dist
# For simplicity in this env, we assume dist is built or we build it here.
# Let's do a multi-stage or just build here.

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Final Stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.js ./
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/*.sqlite ./
# Copy other assets if needed (logo, etc)
COPY --from=builder /app/logo.jpg ./
COPY --from=builder /app/manifest.json ./

RUN npm ci --only=production

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
