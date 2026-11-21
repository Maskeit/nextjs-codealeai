"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useLang } from "@/components/LangProvider"
import { ProviderDot, tooltipRow } from "@/components/ai-results/chart-parts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { providerColor, tint } from "@/lib/chart-colors"
import {
  formatCost,
  formatCostAxis,
  formatDay,
  formatLatency,
  formatTokens,
} from "@/lib/format"
import type { ProviderStats } from "@/lib/results"

interface ProviderPanelProps {
  provider: ProviderStats
  providers: ProviderStats[]
  onSelect: (providerId: string) => void
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}

// Detalle de un proveedor (una API key): costo diario y tokens por modelo.
// Se muestran dos a la vez para compararlos lado a lado.
export function ProviderPanel({
  provider,
  providers,
  onSelect,
}: ProviderPanelProps) {
  const { t, lang } = useLang()
  const color = providerColor(provider.colorIndex)
  const tokens = (value: number) => formatTokens(value, lang)

  const costConfig = {
    cost: { label: t("results.panel.cost"), theme: color },
  } satisfies ChartConfig

  const tokensConfig = {
    inputTokens: { label: t("results.panel.input"), theme: color },
    outputTokens: { label: t("results.panel.output"), theme: tint(color, 50) },
  } satisfies ChartConfig

  const modelsWithUse = provider.models.filter((model) => model.requests > 0)
  const showDaily = provider.daily.length > 0 && provider.requests > 0

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center justify-between gap-3">
        <Select value={provider.id} onValueChange={onSelect}>
          <SelectTrigger className="w-56" aria-label={t("results.panel.select_label")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {providers.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                <ProviderDot color={providerColor(item.colorIndex).light} />
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="font-mono text-xs text-muted-foreground">
          {provider.keyHint
            ? t("results.panel.key_badge", { hint: provider.keyHint })
            : t("results.panel.no_key")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniStat label={t("results.panel.cost")} value={formatCost(provider.cost)} />
        <MiniStat
          label={t("results.panel.requests")}
          value={`${tokens(provider.requests)}${
            provider.errors
              ? ` · ${t("results.panel.errors_short", { count: provider.errors })}`
              : ""
          }`}
        />
        <MiniStat
          label={t("results.panel.tokens_in_out")}
          value={`${tokens(provider.inputTokens)} / ${tokens(provider.outputTokens)}`}
        />
        <MiniStat label={t("results.panel.avg_latency")} value={formatLatency(provider.avgLatencyMs)} />
      </div>

      {!showDaily ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t("results.panel.empty", { name: provider.name })}
        </p>
      ) : (
        <>
          <section className="space-y-2">
            <h3 className="text-sm font-medium">{t("results.panel.cost_per_day")}</h3>
            <ChartContainer config={costConfig} className="aspect-auto h-44 w-full">
              <BarChart data={provider.daily} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={28}
                  tickFormatter={(value) => formatDay(String(value), lang)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={formatCostAxis}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => formatDay(String(value), lang)}
                      formatter={tooltipRow(formatCost, () => t("results.panel.cost"))}
                    />
                  }
                />
                <Bar
                  dataKey="cost"
                  fill="var(--color-cost)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ChartContainer>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium">{t("results.panel.tokens_per_model")}</h3>
            <ChartContainer
              config={tokensConfig}
              className="aspect-auto w-full"
              style={{ height: 56 + modelsWithUse.length * 40 }}
            >
              <BarChart
                data={modelsWithUse}
                layout="vertical"
                margin={{ left: 0, right: 8 }}
              >
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tickMargin={8}
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={tokens}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={tooltipRow(
                        tokens,
                        (name) => tokensConfig[name as keyof typeof tokensConfig]?.label ?? name
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                {/* 2px del color de la superficie separa los segmentos apilados */}
                <Bar
                  dataKey="inputTokens"
                  stackId="tokens"
                  fill="var(--color-inputTokens)"
                  stroke="var(--card)"
                  strokeWidth={2}
                  barSize={18}
                />
                <Bar
                  dataKey="outputTokens"
                  stackId="tokens"
                  fill="var(--color-outputTokens)"
                  stroke="var(--card)"
                  strokeWidth={2}
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                />
              </BarChart>
            </ChartContainer>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium">{t("results.panel.detail_per_model")}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("results.panel.col_model")}</TableHead>
                  <TableHead className="text-right">{t("results.panel.col_requests")}</TableHead>
                  <TableHead className="text-right">{t("results.panel.col_input")}</TableHead>
                  <TableHead className="text-right">{t("results.panel.col_output")}</TableHead>
                  <TableHead className="text-right">{t("results.panel.col_cost")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelsWithUse.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {model.requests}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {tokens(model.inputTokens)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {tokens(model.outputTokens)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCost(model.cost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </>
      )}
    </div>
  )
}
