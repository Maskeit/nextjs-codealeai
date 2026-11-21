import axios from "axios"

// Formato de request/stream: "openai" = compatible con /chat/completions
export type ModelProtocol = "openai" | "anthropic"

// Modelo seleccionable en el chat (viene de SQLite, sin la API key)
export interface ChatModelOption {
  id: string
  name: string
  providerId: string
  providerName: string
  protocol: ModelProtocol
}

export interface ModelMessage {
  role: "user" | "assistant"
  content: string
}

interface StreamModelOptions {
  protocol: ModelProtocol
  modelId: string
  messages: ModelMessage[]
  signal: AbortSignal
  onToken: (token: string) => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getTextDelta(protocol: ModelProtocol, value: unknown): string {
  if (!isRecord(value)) {
    return ""
  }

  if (
    protocol === "anthropic" &&
    value.type === "content_block_delta" &&
    isRecord(value.delta) &&
    typeof value.delta.text === "string"
  ) {
    return value.delta.text
  }

  const choices = value.choices
  if (!Array.isArray(choices) || !isRecord(choices[0])) {
    return ""
  }

  const delta = choices[0].delta
  if (!isRecord(delta)) {
    return ""
  }

  if (typeof delta.content === "string") {
    return delta.content
  }

  if (Array.isArray(delta.content)) {
    return delta.content
      .filter(
        (part): part is Record<string, unknown> =>
          isRecord(part) && typeof part.text === "string"
      )
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("")
  }

  return ""
}

function getFullResponseText(protocol: ModelProtocol, value: unknown): string {
  if (!isRecord(value)) {
    return ""
  }

  if (
    protocol === "anthropic" &&
    Array.isArray(value.content)
  ) {
    return value.content
      .filter(
        (part): part is Record<string, unknown> =>
          isRecord(part) && part.type === "text" && typeof part.text === "string"
      )
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("")
  }

  const choices = value.choices
  if (!Array.isArray(choices) || !isRecord(choices[0])) {
    return ""
  }

  const message = choices[0].message
  return isRecord(message) && typeof message.content === "string"
    ? message.content
    : ""
}

// Error con clave de traducción (errors.<key>); getModelErrorMessage la resuelve.
export class ModelError extends Error {
  constructor(
    readonly key: string,
    readonly params?: Record<string, string>
  ) {
    super(key)
  }
}

type Translate = (key: string, vars?: Record<string, string | number>) => string

export async function streamModelResponse({
  protocol,
  modelId,
  messages,
  signal,
  onToken,
}: StreamModelOptions): Promise<void> {
  let buffer = ""
  let receivedLength = 0
  let receivedSseFrame = false
  let receivedDelta = false
  let parseError: Error | undefined

  function processLine(line: string) {
    if (!line.startsWith("data:")) {
      return
    }

    const data = line.slice(5).trim()
    if (!data || data === "[DONE]") {
      return
    }

    receivedSseFrame = true
    let payload: unknown

    try {
      payload = JSON.parse(data)
    } catch {
      parseError = new ModelError("invalid_event")
      return
    }

    if (isRecord(payload) && isRecord(payload.error)) {
      const message = payload.error.message
      parseError =
        typeof message === "string"
          ? new Error(message)
          : new ModelError("provider_error")
      return
    }

    const token = getTextDelta(protocol, payload)
    if (token) {
      receivedDelta = true
      onToken(token)
    }
  }

  function processText(text: string) {
    const fragment = text.slice(receivedLength)
    receivedLength = text.length
    buffer += fragment

    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ""
    lines.forEach(processLine)
  }

  const response = await axios.post<string>(
    "/api/chat",
    { modelId, messages },
    {
      adapter: "xhr",
      headers: {
        "Content-Type": "application/json",
      },
      responseType: "text",
      signal,
      onDownloadProgress: ({ event }) => {
        const xhr = event?.target
        if (xhr instanceof XMLHttpRequest) {
          processText(xhr.responseText)
        }
      },
    }
  )

  if (typeof response.data === "string") {
    processText(response.data)
  }
  if (buffer.trim()) {
    processLine(buffer)
  }
  if (parseError) {
    throw parseError
  }

  if (!receivedSseFrame && typeof response.data === "string") {
    let payload: unknown
    try {
      payload = JSON.parse(response.data)
    } catch {
      throw new ModelError("unparseable_response")
    }

    const text = getFullResponseText(protocol, payload)
    if (text) {
      onToken(text)
      receivedDelta = true
    }
  }

  if (!receivedDelta) {
    throw new ModelError("empty_response")
  }
}

// Mensaje listo para mostrar. Los errores con código (del servidor o ModelError)
// se traducen con `t`; el resto conserva el texto original del proveedor.
export function getModelErrorMessage(error: unknown, t: Translate): string {
  const translate = (code: unknown, params?: unknown) =>
    t(
      `errors.${String(code)}`,
      isRecord(params) ? (params as Record<string, string>) : undefined
    )

  if (error instanceof ModelError) {
    return translate(error.key, error.params)
  }

  if (axios.isAxiosError(error)) {
    const rawData: unknown = error.response?.data
    let responseData: unknown = rawData
    if (typeof rawData === "string") {
      try {
        responseData = JSON.parse(rawData)
      } catch {
        if (rawData.trim()) {
          return rawData
        }
      }
    }

    if (isRecord(responseData) && isRecord(responseData.error)) {
      const { code, message, params } = responseData.error
      if (typeof code === "string") {
        return translate(code, params)
      }
      if (typeof message === "string") {
        return message
      }
    }

    if (error.response?.status === 401) {
      return t("errors.api_key_rejected")
    }
    return error.message || t("errors.request_failed")
  }

  return error instanceof Error ? error.message : t("errors.unexpected")
}
