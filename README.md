# Codeale AI

Herramienta para probar y comparar APIs, API keys y modelos de IA lado a lado (respuestas, latencia, tokens y costo). No es un chat de propósito general: su función es comparar.

> La versión alojada es solo una demo y no tiene API keys. Para usar el chat con tus propias claves, instala el proyecto en tu máquina.

## Privacidad

Todo se guarda de forma local, en una base SQLite en tu máquina (`prisma/dev.db`, fuera de git). Ahí viven tus API keys, chats e historial de uso. Las claves solo se usan para enviar tus solicitudes al proveedor que configuraste y nunca vuelven al navegador. Puedes borrarlas cuando quieras desde `/config`.

## Instalación local

### Requisitos

- [Node.js](https://nodejs.org/) 20 o superior
- [pnpm](https://pnpm.io/) (el proyecto usa `pnpm@11`; con `corepack enable` se activa solo)
- Una herramienta de compilación nativa para `better-sqlite3` (en macOS, Xcode Command Line Tools; en Linux, `build-essential` y `python3`; en Windows, Visual Studio Build Tools)

### Pasos

```bash
# 1. Clonar e instalar dependencias
git clone https://github.com/Maskeit/nextjs-codealeai.git
cd nextjs-codealeai
pnpm install

# 2. Variables de entorno
cp .env.example .env        # DATABASE_URL="file:./prisma/dev.db"

# 3. Base de datos: generar el cliente, aplicar migraciones y cargar proveedores de ejemplo
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 4. Iniciar en modo desarrollo
pnpm dev
```

Abre <http://localhost:3000>, ve a `/config`, pega la API key de un proveedor y ya puedes chatear y comparar.

### Ejecutar en modo producción (local)

```bash
pnpm build
pnpm start
```

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` / `pnpm start` | Compila y sirve en producción |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Genera el cliente de Prisma |
| `pnpm db:migrate` | Aplica las migraciones |
| `pnpm db:seed` | Carga proveedores y modelos de ejemplo (no pisa tus claves ni precios) |
| `pnpm db:studio` | Abre Prisma Studio para ver la base |

## Problemas comunes

- **Error con `better-sqlite3` al instalar:** faltan las herramientas de compilación nativas; instálalas y repite `pnpm install`.
- **No aparecen modelos en el chat:** agrega la API key de un proveedor en `/config`.
- **Costos en 0:** los precios por millón de tokens se rellenan a mano en `/config`.