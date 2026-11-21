"use client"

import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { useLang } from "@/components/LangProvider"
import { Button } from "@/components/ui/button"

export function ConfigHeader() {
  const { t } = useLang()

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm" aria-label={t("config.back_to_chat")}>
          <Link href="/">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("config.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("config.subtitle")}</p>
        </div>
      </div>
    </div>
  )
}

export function ProvidersEmpty() {
  const { t } = useLang()

  return (
    <p className="text-sm text-muted-foreground">
      {t("config.no_providers")}{" "}
      <code className="rounded bg-muted px-1 py-0.5">pnpm db:seed</code>{" "}
      {t("config.no_providers_seed")}
    </p>
  )
}
