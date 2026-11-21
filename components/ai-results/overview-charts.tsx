"use client"

import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from "recharts"

import { useLang } from "@/components/LangProvider"
import { tooltipRow } from "@/components/ai-results/chart-parts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { providerColor, providerKey } from "@/lib/chart-colors"
import { formatCost, formatCostAxis, formatDay } from "@/lib/format"
import type { ProviderStats } from "@/lib/results"

interface OverviewChartsProps {
  days: string[]
  providers: ProviderStats[]
}

export function OverviewCharts({ days, providers }: OverviewChartsProps) {
  const { t, lang } = useLang()
  // Solo proveedores con uso; el color sigue al proveedor, no a su posición aquí.
  const active = providers.filter((provider) => provider.requests > 0)

  if (active.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t("results.charts.empty")}
      </p>
    )
  }

  const config = Object.fromEntries(
    active.map((provider) => [
      providerKey(provider.colorIndex),
      { label: provider.name, theme: providerColor(provider.colorIndex) },
    ])
  ) satisfies ChartConfig

  const labelOf = (name: string) => config[name]?.label ?? name

  const timeline = days.map((date, index) => ({
    date,
    ...Object.fromEntries(
      active.map((provider) => [
        providerKey(provider.colorIndex),
        provider.daily[index]?.cost ?? 0,
      ])
    ),
  }))

  const byProvider = [...active]
    .sort((a, b) => b.cost - a.cost)
    .map((provider) => ({
      key: providerKey(provider.colorIndex),
      provider: provider.name,
      cost: provider.cost,
      fill: `var(--color-${providerKey(provider.colorIndex)})`,
    }))

  const showDots = days.length <= 14

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>{t("results.charts.cost_per_day")}</CardTitle>
          <CardDescription>{t("results.charts.cost_per_day_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className="aspect-auto h-64 w-full">
            <LineChart data={timeline} margin={{ left: 4, right: 12, top: 8 }}>
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
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatDay(String(value), lang)}
                    formatter={tooltipRow(formatCost, labelOf)}
                  />
                }
              />
              {active.map((provider) => {
                const key = providerKey(provider.colorIndex)
                return (
                  <Line
                    key={key}
                    dataKey={key}
                    type="linear"
                    stroke={`var(--color-${key})`}
                    strokeWidth={2}
                    dot={
                      showDots
                        ? { r: 4, strokeWidth: 2, stroke: "var(--card)" }
                        : false
                    }
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
                  />
                )
              })}
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t("results.charts.cost_by_provider")}</CardTitle>
          <CardDescription>{t("results.charts.cost_by_provider_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className="aspect-auto h-64 w-full">
            <BarChart
              data={byProvider}
              layout="vertical"
              margin={{ left: 0, right: 64 }}
            >
              <YAxis
                dataKey="provider"
                type="category"
                tickLine={false}
                axisLine={false}
                width={96}
                tickMargin={8}
              />
              <XAxis type="number" hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={tooltipRow(
                      formatCost,
                      (_name, item) => item.payload?.provider
                    )}
                  />
                }
              />
              <Bar dataKey="cost" radius={[0, 4, 4, 0]} barSize={20}>
                <LabelList
                  dataKey="cost"
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                  formatter={(value: unknown) => formatCost(Number(value))}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
