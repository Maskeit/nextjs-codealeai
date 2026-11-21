// Solo servidor. Extrae tokens de la respuesta del proveedor y guarda el
// UsageRecord (solo métricas: nada de contenido de mensajes).
import { db } from "@/lib/db"

export interface UsageContext {
  providerId: string
  modelId: string
  inputPricePerMTok: number
  outputPricePerMTok: number
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

export type UsageStatus = "success" | "error" | "aborted"

// Tope para el respaldo de respuestas no-SSE (JSON completo).
const MAX_PLAIN_BYTES = 2_000_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function count(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : undefined
}

// Cubre ambos formatos sin depender del protocolo:
// - Anthropic: message_start -> message.usage, message_delta -> usage
//   (input_tokens / output_tokens)
// - OpenAI y compatibles: último chunk -> usage (prompt_tokens / completion_tokens)
function readUsage(
  value: unknown
): { input?: number; output?: number } | undefined {
  if (!isRecord(value)) return undefined

  const usage = isRecord(value.usage)
    ? value.usage
    : isRecord(value.message) && isRecord(value.message.usage)
      ? value.message.usage
      : undefined
  if (!usage) return undefined

  const input = count(usage.input_tokens) ?? count(usage.prompt_tokens)
  const output = count(usage.output_tokens) ?? count(usage.completion_tokens)
  if (input === undefined && output === undefined) return undefined
  return { input, output }
}

// Se alimenta con el texto del stream a medida que pasa; no guarda el contenido.
export function createUsageTracker() {
  let buffer = ""
  let plain = ""
  let sawSse = false
  let input: number | undefined
  let output: number | undefined

  function absorb(value: unknown) {
    const usage = readUsage(value)
    if (!usage) return
    // El último valor gana: los conteos de Anthropic son acumulados.
    if (usage.input !== undefined) input = usage.input
    if (usage.output !== undefined) output = usage.output
  }

  function processLine(line: string) {
    if (!line.startsWith("data:")) return
    sawSse = true
    const data = line.slice(5).trim()
    // Evita parsear cada delta de texto: solo los eventos con usage.
    if (!data.includes('"usage"')) return
    try {
      absorb(JSON.parse(data))
    } catch {
      // Evento incompleto o inválido: se ignora.
    }
  }

  return {
    push(text: string) {
      if (!sawSse && plain.length < MAX_PLAIN_BYTES) plain += text
      buffer += text
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ""
      lines.forEach(processLine)
    },
    // Devuelve lo capturado hasta ahora (parcial si el stream se cortó).
    finish(): TokenUsage | undefined {
      if (buffer) processLine(buffer)
      buffer = ""
      if (!sawSse) {
        try {
          absorb(JSON.parse(plain))
        } catch {
          // No era JSON.
        }
      }
      if (input === undefined && output === undefined) return undefined
      return { inputTokens: input ?? 0, outputTokens: output ?? 0 }
    },
  }
}

// Calcula y guarda el costo al momento de la petición, con los precios de hoy,
// para que cambiarlos después no reescriba el historial.
export async function recordUsage(
  context: UsageContext,
  usage: TokenUsage | undefined,
  meta: { status: UsageStatus; startedAt: number }
) {
  const inputTokens = usage?.inputTokens ?? 0
  const outputTokens = usage?.outputTokens ?? 0
  const inputCost = (inputTokens / 1_000_000) * context.inputPricePerMTok
  const outputCost = (outputTokens / 1_000_000) * context.outputPricePerMTok

  try {
    await db.usageRecord.create({
      data: {
        providerId: context.providerId,
        modelId: context.modelId,
        inputTokens,
        outputTokens,
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost,
        latencyMs: Date.now() - meta.startedAt,
        status: meta.status,
      },
    })
  } catch (error) {
    // Registrar el uso nunca debe romper el chat.
    console.error("No se pudo guardar el uso:", error)
  }
}
