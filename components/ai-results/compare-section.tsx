"use client"

import { useLang } from "@/components/LangProvider"
import { ComparePanels } from "@/components/ai-results/compare-panels"
import type { ProviderStats } from "@/lib/results"

export function CompareSection({ providers }: { providers: ProviderStats[] }) {
  const { t } = useLang()

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">{t("results.compare.title")}</h2>
        <p className="text-xs text-muted-foreground">
          {t("results.compare.description")}
        </p>
      </div>
      <ComparePanels providers={providers} />
    </section>
  )
}
