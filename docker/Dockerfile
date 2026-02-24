# Build stage for frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Build stage for backend
FROM node:22-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/ .
RUN npm run build

# Runtime stage
FROM node:22-alpine
WORKDIR /app
RUN npm install -g pm2

# Install backend dependencies (production only)
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --production
COPY backend/prisma ./prisma
RUN npx prisma generate

# Copy built backend
COPY --from=backend-build /app/backend/dist ./dist

# Copy built frontend into backend dist/public
COPY --from=frontend-build /app/frontend/dist ./dist/public

WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "dist/main.js"]
