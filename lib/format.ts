// Formateo compartido servidor/cliente para el dashboard de resultados.

export function formatCost(value: number): string {
  if (value === 0) return "$0.00"
  const abs = Math.abs(value)
  const digits = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6
  return `$${value.toFixed(digits)}`
}

export function formatCostAxis(value: number): string {
  return value === 0 ? "$0" : `$${+value.toPrecision(2)}`
}

export function formatTokens(value: number, locale = "es"): string {
  return new Intl.NumberFormat(locale, {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatLatency(ms: number | null): string {
  if (ms === null) return "—"
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`
}

// "2026-11-19" -> "19 nov"
export function formatDay(key: string, locale = "es"): string {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  })
}
