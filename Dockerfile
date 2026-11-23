# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# pnpm (versión fijada en package.json) y toolchain por si better-sqlite3 necesita compilarse
RUN corepack enable \
 && apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Cliente de Prisma y build. Se usa una base temporal solo para compilar.
RUN DATABASE_URL="file:/tmp/build.db" pnpm db:generate \
 && DATABASE_URL="file:/tmp/build.db" pnpm exec prisma migrate deploy \
 && DATABASE_URL="file:/tmp/build.db" pnpm build \
 && rm -f /tmp/build.db

# La base de datos (con las API keys) vive en un volumen, nunca dentro de la imagen
ENV NODE_ENV=production \
    DATABASE_URL="file:/data/codeale.db" \
    PORT=3000 \
    HOSTNAME=0.0.0.0
VOLUME /data
EXPOSE 3000

# Aplica migraciones, carga proveedores de ejemplo (idempotente) y arranca
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm db:seed && pnpm start -H 0.0.0.0"]
