"use client"

import { useLang } from "@/components/LangProvider"
import { ProviderDot } from "@/components/ai-results/chart-parts"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { providerColor } from "@/lib/chart-colors"
import {
  formatCost,
  formatLatency,
  formatTokens,
} from "@/lib/format"
import type { ResultsData } from "@/lib/results"

export function ProviderSummary({ data }: { data: ResultsData }) {
  const { t } = useLang()

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium">{t("results.summary.title")}</h2>
      <div className="rounded-xl border bg-card px-2">
        <ProviderTable data={data} />
      </div>
    </section>
  )
}

// Vista en tabla del uso por proveedor (cada proveedor = una API key).
// Es también la alternativa accesible a los gráficos.
export function ProviderTable({ data }: { data: ResultsData }) {
  const { t, lang } = useLang()
  const providers = [...data.providers].sort((a, b) => b.cost - a.cost)
  const { totals } = data

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("results.summary.provider")}</TableHead>
          <TableHead className="text-right">{t("results.summary.requests")}</TableHead>
          <TableHead className="text-right">{t("results.summary.errors")}</TableHead>
          <TableHead className="text-right">{t("results.summary.input")}</TableHead>
          <TableHead className="text-right">{t("results.summary.output")}</TableHead>
          <TableHead className="text-right">{t("results.summary.latency")}</TableHead>
          <TableHead className="text-right">{t("results.summary.cost")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {providers.map((provider) => (
          <TableRow key={provider.id}>
            <TableCell>
              <span className="flex items-center gap-2 font-medium">
                <ProviderDot color={providerColor(provider.colorIndex).light} />
                {provider.name}
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  {provider.keyHint ? `····${provider.keyHint}` : t("results.summary.no_key")}
                </span>
              </span>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatTokens(provider.requests, lang)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {provider.errors}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatTokens(provider.inputTokens, lang)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatTokens(provider.outputTokens, lang)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatLatency(provider.avgLatencyMs)}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatCost(provider.cost)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="font-medium">{t("results.summary.total")}</TableCell>
          <TableCell className="text-right tabular-nums">
            {formatTokens(totals.requests, lang)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {totals.errors}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatTokens(totals.inputTokens, lang)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatTokens(totals.outputTokens, lang)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatLatency(totals.avgLatencyMs)}
          </TableCell>
          <TableCell className="text-right font-medium tabular-nums">
            {formatCost(totals.cost)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
