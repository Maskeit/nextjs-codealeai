import type * as React from "react"

import type { ChartTooltipContent } from "@/components/ui/chart"

type TooltipFormatter = NonNullable<
  React.ComponentProps<typeof ChartTooltipContent>["formatter"]
>

// Fila del tooltip: muestra el color de la serie, su nombre y el valor ya
// formateado (costo, tokens...). El texto usa tokens de texto, no el color de la serie.
export function tooltipRow(
  format: (value: number) => string,
  labelOf: (
    name: string,
    item: Parameters<TooltipFormatter>[2]
  ) => React.ReactNode
): TooltipFormatter {
  return (value, name, item) => (
    <div className="flex w-full items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span
          className="size-2.5 shrink-0 rounded-[2px]"
          style={{ background: item.color ?? item.payload?.fill }}
        />
        {labelOf(String(name), item)}
      </span>
      <span className="font-mono font-medium text-foreground tabular-nums">
        {format(Number(value))}
      </span>
    </div>
  )
}

export function ProviderDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="inline-block size-2.5 shrink-0 rounded-[3px]"
      style={{ background: color }}
    />
  )
}
