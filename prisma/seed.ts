// Proveedores y modelos iniciales (tomados del chat original).
// Idempotente: no pisa API keys, precios ni cambios que hayas hecho en /config.
// Los precios quedan en 0: rellénalos en /config para ver costos reales.
import "dotenv/config"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

import { PrismaClient } from "../lib/generated/prisma/client"

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
})

const providers = [
  {
    slug: "openai",
    name: "OpenAI",
    protocol: "openai",
    baseUrl: "https://api.openai.com/v1",
    authHeader: "Authorization",
    authScheme: "Bearer",
    models: [
      { apiModelId: "gpt-5", displayName: "GPT-5" },
      { apiModelId: "gpt-5-mini", displayName: "GPT-5 mini" },
    ],
  },
  {
    slug: "anthropic",
    name: "Anthropic",
    protocol: "anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    authHeader: "x-api-key",
    authScheme: null,
    extraHeaders: JSON.stringify({ "anthropic-version": "2023-06-01" }),
    models: [
      { apiModelId: "claude-sonnet-4-5", displayName: "Claude Sonnet 4.5" },
      { apiModelId: "claude-haiku-4-5", displayName: "Claude Haiku 4.5" },
    ],
  },
  {
    slug: "oneprovider",
    name: "OneProvider",
    protocol: "anthropic",
    baseUrl: "https://api.oneprovider.dev/v1",
    authHeader: "x-api-key",
    authScheme: null,
    extraHeaders: JSON.stringify({ "anthropic-version": "2023-06-01" }),
    maxTokens: 1024,
    models: [
      { apiModelId: "claude-sonnet-5-5", displayName: "Claude Sonnet 5.5" },
      { apiModelId: "claude-opus-5-5", displayName: "Claude Opus 5.5" },
      { apiModelId: "claude-haiku-4-5", displayName: "Claude Haiku 4.5" },
    ],
  },
  {
    slug: "qwen",
    name: "Qwen",
    protocol: "openai",
    baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    authHeader: "Authorization",
    authScheme: "Bearer",
    models: [
      { apiModelId: "qwen-plus", displayName: "Qwen Plus" },
      { apiModelId: "qwen-max", displayName: "Qwen Max" },
    ],
  },
]

async function main() {
  for (const { models, ...data } of providers) {
    // update vacío: si el proveedor ya existe no se toca nada.
    const provider = await db.provider.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    })
    for (const model of models) {
      await db.model.upsert({
        where: {
          providerId_apiModelId: {
            providerId: provider.id,
            apiModelId: model.apiModelId,
          },
        },
        update: {},
        create: { ...model, providerId: provider.id },
      })
    }
  }
  console.log(`Seed listo: ${providers.length} proveedores.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
