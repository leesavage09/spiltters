# Frontend deps
FROM node:22-alpine AS frontend-deps
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

# Frontend build
FROM frontend-deps AS frontend-build
COPY frontend/ .
RUN npm run build


# Backend deps
FROM node:22-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install

# Backend build
FROM backend-deps AS backend-build
COPY backend/ .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runtime-deps
WORKDIR /app
COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate

FROM node:22-alpine AS runtime
WORKDIR /app

COPY --from=runtime-deps /app/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=frontend-build /app/frontend/dist ./dist/src/public
COPY --from=runtime-deps /app/prisma ./prisma
COPY --from=backend-build /app/backend/prisma.config.ts ./prisma.config.ts

EXPOSE 3000
CMD ["node", "dist/src/main.js"]