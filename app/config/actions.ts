"use server"

import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"

export interface ActionState {
  status: "idle" | "success" | "error"
  // Clave de config.messages.* (se traduce en el cliente)
  message: string
}

const ok = (message: string): ActionState => ({ status: "success", message })
const fail = (message: string): ActionState => ({ status: "error", message })

function text(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

function number(formData: FormData, name: string): number | undefined {
  const raw = text(formData, name)
  if (raw === "") return 0
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function refresh() {
  revalidatePath("/config")
  revalidatePath("/")
}

function isUniqueError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  )
}

export async function saveProvider(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = text(formData, "id")
  const name = text(formData, "name")
  const protocol = text(formData, "protocol")
  const baseUrl = text(formData, "baseUrl").replace(/\/+$/, "")
  const apiKey = text(formData, "apiKey")
  const authHeader = text(formData, "authHeader")
  const authScheme = text(formData, "authScheme")
  const extraHeaders = text(formData, "extraHeaders")
  const maxTokens = Number(text(formData, "maxTokens") || 4096)

  if (!name) return fail("name_required")
  if (protocol !== "openai" && protocol !== "anthropic") {
    return fail("invalid_protocol")
  }
  try {
    const url = new URL(baseUrl)
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error()
  } catch {
    return fail("invalid_base_url")
  }
  if (!authHeader) return fail("auth_header_required")
  if (!Number.isInteger(maxTokens) || maxTokens < 1) {
    return fail("invalid_max_tokens")
  }
  if (extraHeaders) {
    try {
      const parsed: unknown = JSON.parse(extraHeaders)
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed) ||
        Object.values(parsed).some((value) => typeof value !== "string")
      ) {
        throw new Error()
      }
    } catch {
      return fail("invalid_extra_headers")
    }
  }

  const data = {
    name,
    protocol,
    baseUrl,
    authHeader,
    authScheme: authScheme || null,
    extraHeaders: extraHeaders || null,
    maxTokens,
    // Vacío = conservar la clave actual; borrar se hace con clearProviderKey.
    ...(apiKey ? { apiKey } : {}),
  }

  try {
    if (id) {
      await db.provider.update({ where: { id }, data })
    } else {
      const slug = slugify(name)
      if (!slug) return fail("name_needs_alphanumeric")
      await db.provider.create({ data: { ...data, slug } })
    }
  } catch (error) {
    if (isUniqueError(error)) return fail("provider_duplicate")
    return fail("provider_save_failed")
  }

  refresh()
  return ok(id ? "provider_saved" : "provider_created")
}

export async function setProviderActive(id: string, isActive: boolean) {
  await db.provider.update({ where: { id }, data: { isActive } })
  refresh()
}

export async function clearProviderKey(id: string) {
  await db.provider.update({ where: { id }, data: { apiKey: null } })
  refresh()
}

export async function deleteProvider(id: string) {
  await db.provider.delete({ where: { id } })
  refresh()
}

export async function saveModel(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = text(formData, "id")
  const providerId = text(formData, "providerId")
  const apiModelId = text(formData, "apiModelId")
  const displayName = text(formData, "displayName") || apiModelId
  const inputPricePerMTok = number(formData, "inputPricePerMTok")
  const outputPricePerMTok = number(formData, "outputPricePerMTok")

  if (!apiModelId) return fail("model_id_required")
  if (inputPricePerMTok === undefined || outputPricePerMTok === undefined) {
    return fail("invalid_prices")
  }

  const data = { apiModelId, displayName, inputPricePerMTok, outputPricePerMTok }

  try {
    if (id) {
      await db.model.update({ where: { id }, data })
    } else {
      if (!providerId) return fail("provider_missing")
      await db.model.create({ data: { ...data, providerId } })
    }
  } catch (error) {
    if (isUniqueError(error)) return fail("model_duplicate")
    return fail("model_save_failed")
  }

  refresh()
  return ok(id ? "model_saved" : "model_added")
}

export async function deleteModel(id: string) {
  await db.model.delete({ where: { id } })
  refresh()
}
