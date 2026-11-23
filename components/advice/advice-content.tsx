"use client"

import Link from "next/link"
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react"

import { useLang } from "@/components/LangProvider"
import { Button } from "@/components/ui/button"

// TODO: reemplazar por el link real del repositorio.
const GITHUB_URL = "https://github.com/Maskeit/nextjs-codealeai.git"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      <div className="space-y-2 text-sm text-muted-foreground">{children}</div>
    </section>
  )
}

export function AdviceContent() {
  const { t } = useLang()

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm" aria-label={t("advice.back_to_chat")}>
          <Link href="/">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("advice.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("advice.subtitle")}</p>
        </div>
      </div>

      <div className="space-y-4">
        <Section title={t("advice.demo.title")}>
          <p>{t("advice.demo.body")}</p>
        </Section>

        <Section title={t("advice.install.title")}>
          <p>{t("advice.install.body")}</p>
          <Button asChild variant="outline" size="sm">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              {t("advice.install.github")}
              <ExternalLinkIcon />
            </a>
          </Button>
        </Section>

        <Section title={t("advice.purpose.title")}>
          <p>{t("advice.purpose.body")}</p>
        </Section>

        <Section title={t("advice.not_a_chat.title")}>
          <p>{t("advice.not_a_chat.body")}</p>
        </Section>

        <Section title={t("advice.privacy.title")}>
          <p>{t("advice.privacy.server")}</p>
          <p>{t("advice.privacy.local")}</p>
          <p>{t("advice.privacy.keys")}</p>
          <p>{t("advice.privacy.control")}</p>
        </Section>

        <Section title={t("advice.responsibility.title")}>
          <p>{t("advice.responsibility.body")}</p>
        </Section>
      </div>
    </>
  )
}
