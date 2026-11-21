import { db } from "@/lib/db"
import type { ModelMessage, ModelProtocol } from "@/lib/model-api"
import {
  createUsageTracker,
  recordUsage,
  type UsageContext,
  type UsageStatus,
} from "@/lib/usage"

interface ChatRequestBody {
  modelId: string
  messages: ModelMessage[]
}

interface UpstreamRequest {
  url: string
  headers: Record<string, string>
  body: Record<string, unknown>
  usage: UsageContext
}

// Error con código: el cliente lo traduce según el idioma elegido (errors.<code>).
class ChatError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly params?: Record<string, string>
  ) {
    super(message)
  }
}

function errorBody(code: string, message: string, params?: Record<string, string>) {
  return { error: { code, message, params } }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseRequestBody(value: unknown): ChatRequestBody | undefined {
  if (
    !isRecord(value) ||
    typeof value.modelId !== "string" ||
    !value.modelId.trim() ||
    !Array.isArray(value.messages)
  ) {
    return undefined
  }

  const messages = value.messages.filter(
    (message): message is ModelMessage =>
      isRecord(message) &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string"
  )

  if (messages.length !== value.messages.length) {
    return undefined
  }

  return { modelId: value.modelId.trim(), messages }
}

// baseUrl puede venir con o sin "/v1" ni el sufijo del endpoint.
function getEndpoint(baseUrl: string, protocol: ModelProtocol): string {
  let url: URL
  try {
    url = new URL(baseUrl.trim())
  } catch {
    throw new ChatError("invalid_base_url", "La Base URL del proveedor no es válida.")
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ChatError("base_url_not_http", "La Base URL del proveedor debe ser http(s).")
  }

  const suffix = protocol === "anthropic" ? "/messages" : "/chat/completions"
  const path = url.pathname.replace(/\/+$/, "")
  if (!path.endsWith(suffix)) {
    url.pathname = `${path}${suffix}`
  }
  return url.toString()
}

function parseExtraHeaders(raw: string | null): Record<string, string> {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
      )
    )
  } catch {
    return {}
  }
}

async function createUpstreamRequest({
  modelId,
  messages,
}: ChatRequestBody): Promise<UpstreamRequest> {
  const model = await db.model.findUnique({
    where: { id: modelId },
    include: { provider: true },
  })
  if (!model) {
    throw new ChatError(
      "model_not_found",
      "El modelo seleccionado ya no existe. Revisa Configuración."
    )
  }

  const { provider } = model
  if (!provider.isActive) {
    throw new ChatError(
      "provider_disabled",
      `El proveedor ${provider.name} está desactivado.`,
      { name: provider.name }
    )
  }
  if (!provider.apiKey) {
    throw new ChatError(
      "missing_api_key",
      `Falta la clave API de ${provider.name} en Configuración.`,
      { name: provider.name }
    )
  }

  const usage: UsageContext = {
    providerId: provider.id,
    modelId: model.id,
    inputPricePerMTok: model.inputPricePerMTok,
    outputPricePerMTok: model.outputPricePerMTok,
  }
  const protocol: ModelProtocol =
    provider.protocol === "anthropic" ? "anthropic" : "openai"
  const url = getEndpoint(provider.baseUrl, protocol)
  const headers: Record<string, string> = {
    ...parseExtraHeaders(provider.extraHeaders),
    [provider.authHeader]: provider.authScheme
      ? `${provider.authScheme} ${provider.apiKey}`
      : provider.apiKey,
  }

  if (protocol === "anthropic") {
    return {
      url,
      headers,
      usage,
      body: {
        model: model.apiModelId,
        max_tokens: provider.maxTokens,
        stream: true,
        messages,
      },
    }
  }

  // OpenAI exige max_completion_tokens en sus modelos nuevos; el resto de
  // endpoints compatibles (Qwen, etc.) usan max_tokens.
  const isOpenAI = new URL(url).hostname === "api.openai.com"
  return {
    url,
    headers,
    usage,
    body: {
      model: model.apiModelId,
      messages,
      stream: true,
      // Sin esto OpenAI y compatibles no envían el uso en el stream.
      stream_options: { include_usage: true },
      ...(isOpenAI
        ? { max_completion_tokens: provider.maxTokens }
        : { max_tokens: provider.maxTokens }),
    },
  }
}

// Reenvía el stream tal cual al cliente y, mientras pasa, cuenta los tokens.
// El registro se guarda una sola vez: al terminar, al fallar o si el cliente
// corta la respuesta (en ese caso con lo capturado hasta ese momento).
function trackUsage(
  upstream: ReadableStream<Uint8Array>,
  context: UsageContext,
  startedAt: number
): ReadableStream<Uint8Array> {
  const reader = upstream.getReader()
  const decoder = new TextDecoder()
  const tracker = createUsageTracker()
  let recorded = false

  function record(status: UsageStatus) {
    if (recorded) return
    recorded = true
    const usage = tracker.finish()
    // Cortado sin ningún dato de uso: no hay nada relevante que guardar.
    if (!usage && status === "aborted") return
    if (!usage) {
      console.warn(
        "El proveedor no devolvió información de uso; no se registró la petición."
      )
      return
    }
    void recordUsage(context, usage, { status, startedAt })
  }

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read()
        if (done) {
          tracker.push(decoder.decode())
          record("success")
          controller.close()
          return
        }
        tracker.push(decoder.decode(value, { stream: true }))
        controller.enqueue(value)
      } catch (error) {
        record("aborted")
        controller.error(error)
      }
    },
    cancel(reason) {
      record("aborted")
      return reader.cancel(reason)
    },
  })
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      errorBody("invalid_json", "El cuerpo de la solicitud debe ser JSON válido."),
      { status: 400 }
    )
  }

  const chatRequest = parseRequestBody(body)
  if (!chatRequest) {
    return Response.json(
      errorBody("missing_data", "Faltan datos válidos para enviar el mensaje."),
      { status: 400 }
    )
  }

  let upstreamRequest: UpstreamRequest
  try {
    upstreamRequest = await createUpstreamRequest(chatRequest)
  } catch (error) {
    const body =
      error instanceof ChatError
        ? errorBody(error.code, error.message, error.params)
        : errorBody(
            "invalid_model_config",
            error instanceof Error
              ? error.message
              : "La configuración del modelo no es válida."
          )
    return Response.json(body, { status: 400 })
  }

  const startedAt = Date.now()
  let upstream: Response
  try {
    upstream = await fetch(upstreamRequest.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...upstreamRequest.headers,
      },
      body: JSON.stringify(upstreamRequest.body),
      cache: "no-store",
      signal: request.signal,
    })
  } catch (error) {
    if (request.signal.aborted) {
      return new Response(null, { status: 499 })
    }

    void recordUsage(upstreamRequest.usage, undefined, {
      status: "error",
      startedAt,
    })
    // Sin código cuando hay detalle del fallo (red, DNS...): se muestra tal cual.
    const body =
      error instanceof Error && error.message
        ? { error: { message: error.message } }
        : errorBody("connect_failed", "No se pudo conectar con el proveedor del modelo.")
    return Response.json(body, { status: 502 })
  }

  if (!upstream.ok) {
    void recordUsage(upstreamRequest.usage, undefined, {
      status: "error",
      startedAt,
    })
    const upstreamBody = await upstream.text()
    return new Response(
      upstreamBody ||
        JSON.stringify(
          errorBody("provider_rejected", "El proveedor rechazó la solicitud.")
        ),
      {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("content-type") ?? "application/json",
          "Cache-Control": "no-store",
        },
      }
    )
  }

  if (!upstream.body) {
    return Response.json(
      errorBody("no_stream", "El proveedor no devolvió un flujo de respuesta."),
      { status: 502 }
    )
  }

  return new Response(
    trackUsage(upstream.body, upstreamRequest.usage, startedAt),
    {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    }
  )
}
