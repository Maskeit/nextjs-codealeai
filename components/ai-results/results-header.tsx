"use client"

import { useLang } from "@/components/LangProvider"

export function ResultsHeader() {
  const { t } = useLang()

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{t("results.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("results.subtitle")}</p>
    </div>
  )
}
