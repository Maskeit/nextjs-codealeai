// Solo servidor. Agrega UsageRecord por proveedor (cada proveedor = una API key)
// para el dashboard de /results.
import { connection } from "next/server"

import { db } from "@/lib/db"

export const RANGES = [
  { id: "7d", label: "7 días", days: 7 },
  { id: "30d", label: "30 días", days: 30 },
  { id: "90d", label: "90 días", days: 90 },
  { id: "all", label: "Todo", days: null },
] as const

export type RangeId = (typeof RANGES)[number]["id"]

export function parseRange(value: string | string[] | undefined): RangeId {
  const id = Array.isArray(value) ? value[0] : value
  return RANGES.find((range) => range.id === id)?.id ?? "30d"
}

export interface DailyPoint {
  date: string
  requests: number
  inputTokens: number
  outputTokens: number
  cost: number
}

export interface ModelStats {
  id: string
  name: string
  requests: number
  inputTokens: number
  outputTokens: number
  cost: number
}

export interface ProviderStats {
  id: string
  name: string
  // Posición estable del proveedor (orden de creación): define su color.
  colorIndex: number
  keyHint: string | null
  requests: number
  errors: number
  aborted: number
  inputTokens: number
  outputTokens: number
  cost: number
  // Promedio solo de respuestas exitosas (los errores son rápidos y sesgan)
  avgLatencyMs: number | null
  // Alineado con ResultsData.days (con ceros en los días sin uso)
  daily: DailyPoint[]
  models: ModelStats[]
}

export interface ResultsData {
  range: RangeId
  days: string[]
  totals: {
    requests: number
    errors: number
    inputTokens: number
    outputTokens: number
    cost: number
    avgLatencyMs: number | null
  }
  providers: ProviderStats[]
}

function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

function buildDays(start: Date, end: Date): string[] {
  const days: string[] = []
  for (
    let cursor = addDays(start, 0);
    cursor <= end;
    cursor = addDays(cursor, 1)
  ) {
    days.push(dayKey(cursor))
  }
  return days
}

const emptyPoint = (date: string): DailyPoint => ({
  date,
  requests: 0,
  inputTokens: 0,
  outputTokens: 0,
  cost: 0,
})

export async function getResults(range: RangeId): Promise<ResultsData> {
  await connection() // siempre datos frescos, nunca prerenderizados

  const now = new Date()
  const rangeDays = RANGES.find((item) => item.id === range)?.days ?? null
  const since = rangeDays ? addDays(now, -(rangeDays - 1)) : undefined
  const sinceStart = since
    ? new Date(since.getFullYear(), since.getMonth(), since.getDate())
    : undefined

  const [providers, records] = await Promise.all([
    db.provider.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        apiKey: true,
        models: { select: { id: true, displayName: true } },
      },
    }),
    db.usageRecord.findMany({
      where: sinceStart ? { createdAt: { gte: sinceStart } } : undefined,
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        providerId: true,
        modelId: true,
        inputTokens: true,
        outputTokens: true,
        totalCost: true,
        latencyMs: true,
        status: true,
      },
    }),
  ])

  const days = buildDays(sinceStart ?? records[0]?.createdAt ?? now, now)

  const stats = new Map<
    string,
    {
      provider: ProviderStats
      daily: Map<string, DailyPoint>
      models: Map<string, ModelStats>
      latencySum: number
      latencyCount: number
    }
  >()

  providers.forEach((provider, index) => {
    stats.set(provider.id, {
      provider: {
        id: provider.id,
        name: provider.name,
        colorIndex: index,
        keyHint: provider.apiKey ? provider.apiKey.slice(-4) : null,
        requests: 0,
        errors: 0,
        aborted: 0,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        avgLatencyMs: null,
        daily: [],
        models: [],
      },
      daily: new Map(days.map((date) => [date, emptyPoint(date)])),
      models: new Map(
        provider.models.map((model) => [
          model.id,
          {
            id: model.id,
            name: model.displayName,
            requests: 0,
            inputTokens: 0,
            outputTokens: 0,
            cost: 0,
          },
        ])
      ),
      latencySum: 0,
      latencyCount: 0,
    })
  })

  let totalLatencySum = 0
  let totalLatencyCount = 0

  for (const record of records) {
    const entry = stats.get(record.providerId)
    if (!entry) continue

    const { provider } = entry
    provider.requests += 1
    provider.inputTokens += record.inputTokens
    provider.outputTokens += record.outputTokens
    provider.cost += record.totalCost
    if (record.status === "error") provider.errors += 1
    if (record.status === "aborted") provider.aborted += 1
    if (record.status === "success" && record.latencyMs !== null) {
      entry.latencySum += record.latencyMs
      entry.latencyCount += 1
      totalLatencySum += record.latencyMs
      totalLatencyCount += 1
    }

    const point = entry.daily.get(dayKey(record.createdAt))
    if (point) {
      point.requests += 1
      point.inputTokens += record.inputTokens
      point.outputTokens += record.outputTokens
      point.cost += record.totalCost
    }

    const model = entry.models.get(record.modelId)
    if (model) {
      model.requests += 1
      model.inputTokens += record.inputTokens
      model.outputTokens += record.outputTokens
      model.cost += record.totalCost
    }
  }

  const result: ProviderStats[] = [...stats.values()].map((entry) => ({
    ...entry.provider,
    avgLatencyMs: entry.latencyCount
      ? entry.latencySum / entry.latencyCount
      : null,
    daily: days.map((date) => entry.daily.get(date) ?? emptyPoint(date)),
    models: [...entry.models.values()].sort((a, b) => b.cost - a.cost),
  }))

  return {
    range,
    days,
    totals: {
      requests: result.reduce((sum, p) => sum + p.requests, 0),
      errors: result.reduce((sum, p) => sum + p.errors, 0),
      inputTokens: result.reduce((sum, p) => sum + p.inputTokens, 0),
      outputTokens: result.reduce((sum, p) => sum + p.outputTokens, 0),
      cost: result.reduce((sum, p) => sum + p.cost, 0),
      avgLatencyMs: totalLatencyCount ? totalLatencySum / totalLatencyCount : null,
    },
    providers: result,
  }
}
