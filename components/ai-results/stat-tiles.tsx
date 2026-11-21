"use client"

import { useLang } from "@/components/LangProvider"
import { Card, CardContent } from "@/components/ui/card"
import {
  formatCost,
  formatLatency,
  formatTokens,
} from "@/lib/format"
import type { ResultsData } from "@/lib/results"

interface StatTileProps {
  label: string
  value: string
  hint?: string
}

export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="space-y-1 px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

export function StatTiles({ totals }: { totals: ResultsData["totals"] }) {
  const { t, lang } = useLang()
  const costPerRequest =
    totals.requests > 0 ? totals.cost / totals.requests : 0

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <StatTile label={t("results.stats.total_cost")} value={formatCost(totals.cost)} />
      <StatTile
        label={t("results.stats.requests")}
        value={formatTokens(totals.requests, lang)}
        hint={
          totals.errors > 0
            ? t("results.stats.errors_hint", { count: totals.errors })
            : t("results.stats.no_errors")
        }
      />
      <StatTile
        label={t("results.stats.input_tokens")}
        value={formatTokens(totals.inputTokens, lang)}
      />
      <StatTile
        label={t("results.stats.output_tokens")}
        value={formatTokens(totals.outputTokens, lang)}
      />
      <StatTile label={t("results.stats.cost_per_request")} value={formatCost(costPerRequest)} />
      <StatTile
        label={t("results.stats.avg_latency")}
        value={formatLatency(totals.avgLatencyMs)}
        hint={t("results.stats.avg_latency_hint")}
      />
    </div>
  )
}
