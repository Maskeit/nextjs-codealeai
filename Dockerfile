# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN corepack enable \
 && apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Variables públicas que se incrustan en el build (si las usas)
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Cliente de Prisma y build con una base temporal, que se elimina después
RUN DATABASE_URL="file:/tmp/build.db" pnpm db:generate \
 && DATABASE_URL="file:/tmp/build.db" pnpm exec prisma migrate deploy \
 && DATABASE_URL="file:/tmp/build.db" pnpm build \
 && rm -f /tmp/build.db

ENV NODE_ENV=production \
    DATABASE_URL="file:/data/codeale.db" \
    PORT=3000 \
    HOSTNAME=0.0.0.0
VOLUME /data
EXPOSE 3000

# exec reemplaza sh por node, para que reciba las señales de apagado
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm db:seed && exec pnpm start -H 0.0.0.0"]