"use client"

import { useState } from "react"

import { useLang } from "@/components/LangProvider"
import { ProviderPanel } from "@/components/ai-results/provider-panel"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ProviderStats } from "@/lib/results"

type Side = 0 | 1

// Dos proveedores lado a lado con divisor arrastrable. Cada panel elige su
// proveedor, así se puede comparar cualquier par de API keys. En pantallas
// estrechas se apilan en vez de dividir el ancho.
export function ComparePanels({ providers }: { providers: ProviderStats[] }) {
  const { t } = useLang()
  const isMobile = useIsMobile()
  const [chosen, setChosen] = useState<[string | null, string | null]>([
    null,
    null,
  ])

  // Por defecto, los dos proveedores con más costo (luego más peticiones)
  const ranked = [...providers].sort(
    (a, b) => b.cost - a.cost || b.requests - a.requests
  )
  const find = (id: string | null) => providers.find((item) => item.id === id)
  const left = find(chosen[0]) ?? ranked[0]
  const right =
    find(chosen[1]) ?? ranked.find((item) => item.id !== left?.id) ?? left

  if (!left || !right) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t("results.compare.empty")}
      </p>
    )
  }

  function select(side: Side, id: string) {
    setChosen((current) => {
      const next: [string | null, string | null] = [
        current[0] ?? left.id,
        current[1] ?? right.id,
      ]
      next[side] = id
      return next
    })
  }

  const panel = (side: Side, provider: ProviderStats) => (
    <ProviderPanel
      provider={provider}
      providers={providers}
      onSelect={(id) => select(side, id)}
    />
  )

  if (isMobile) {
    return (
      <div className="divide-y rounded-xl border bg-card">
        <div>{panel(0, left)}</div>
        <div>{panel(1, right)}</div>
      </div>
    )
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-[820px] rounded-xl border bg-card"
    >
      <ResizablePanel
        id="compare-left"
        defaultSize="50%"
        minSize="30%"
        className="overflow-y-auto"
      >
        {panel(0, left)}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        id="compare-right"
        defaultSize="50%"
        minSize="30%"
        className="overflow-y-auto"
      >
        {panel(1, right)}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
