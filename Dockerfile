# ─── Stage 1: Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar manifiestos del monorepo
COPY package.json package-lock.json turbo.json ./

# Copiar solo los workspaces necesarios para la API
COPY packages/shared/ ./packages/shared/
COPY apps/api/         ./apps/api/

# Instalar dependencias del monorepo completo
# (npm workspaces resuelve @senatic/shared automáticamente)
RUN npm ci --ignore-scripts

# Compilar el paquete compartido
RUN npm run build -w @senatic/shared

# Compilar la API
RUN npm run build -w @senatic/api

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copiar artefactos de build + dependencias de producción
COPY --from=builder /app/package.json            ./
COPY --from=builder /app/package-lock.json       ./
COPY --from=builder /app/packages/shared/        ./packages/shared/
COPY --from=builder /app/apps/api/dist/          ./apps/api/dist/
COPY --from=builder /app/apps/api/package.json   ./apps/api/

# Copiar el contenido de lecciones (JSON estático)
COPY content/ ./content/

# Instalar solo dependencias de producción
RUN npm ci --omit=dev --ignore-scripts

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
