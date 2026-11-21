// Solo servidor. Consultas de proveedores/modelos para /config y el chat.
// Nunca devuelve la API key completa: solo si existe y sus últimos 4 caracteres.
import { connection } from "next/server"

import { db } from "@/lib/db"
import type { ChatModelOption, ModelProtocol } from "@/lib/model-api"

export interface ModelView {
  id: string
  apiModelId: string
  displayName: string
  inputPricePerMTok: number
  outputPricePerMTok: number
}

export interface ProviderView {
  id: string
  name: string
  slug: string
  protocol: ModelProtocol
  baseUrl: string
  hasKey: boolean
  keyHint: string | null
  authHeader: string
  authScheme: string | null
  extraHeaders: string | null
  maxTokens: number
  isActive: boolean
  models: ModelView[]
}

function toProtocol(value: string): ModelProtocol {
  return value === "anthropic" ? "anthropic" : "openai"
}

export async function listProviders(): Promise<ProviderView[]> {
  await connection() // datos por petición, nunca prerenderizados
  const rows = await db.provider.findMany({
    orderBy: { createdAt: "asc" },
    include: { models: { orderBy: { createdAt: "asc" } } },
  })

  return rows.map((provider) => ({
    id: provider.id,
    name: provider.name,
    slug: provider.slug,
    protocol: toProtocol(provider.protocol),
    baseUrl: provider.baseUrl,
    hasKey: Boolean(provider.apiKey),
    keyHint: provider.apiKey ? provider.apiKey.slice(-4) : null,
    authHeader: provider.authHeader,
    authScheme: provider.authScheme,
    extraHeaders: provider.extraHeaders,
    maxTokens: provider.maxTokens,
    isActive: provider.isActive,
    models: provider.models.map((model) => ({
      id: model.id,
      apiModelId: model.apiModelId,
      displayName: model.displayName,
      inputPricePerMTok: model.inputPricePerMTok,
      outputPricePerMTok: model.outputPricePerMTok,
    })),
  }))
}

// Modelos disponibles en el chat: proveedor activo y con clave guardada.
export async function listChatModels(): Promise<ChatModelOption[]> {
  await connection()
  const rows = await db.model.findMany({
    where: { provider: { isActive: true, apiKey: { not: null } } },
    orderBy: [{ provider: { createdAt: "asc" } }, { createdAt: "asc" }],
    include: { provider: true },
  })

  return rows
    .filter((model) => model.provider.apiKey)
    .map((model) => ({
      id: model.id,
      name: model.displayName,
      providerId: model.providerId,
      providerName: model.provider.name,
      protocol: toProtocol(model.provider.protocol),
    }))
}
