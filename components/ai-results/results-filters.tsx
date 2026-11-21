"use client"

import Link from "next/link"

import { useLang } from "@/components/LangProvider"
import { Button } from "@/components/ui/button"
import type { RangeId } from "@/lib/results"

// Mismos ids que RANGES en lib/results (que importa la base de datos: no se usa en el cliente).
const RANGE_IDS: RangeId[] = ["7d", "30d", "90d", "all"]

// El rango vive en la URL (?range=7d): se puede compartir y recargar.
export function ResultsFilters({ range }: { range: RangeId }) {
  const { t } = useLang()

  return (
    <nav aria-label={t("results.range_label")} className="flex flex-wrap gap-2">
      {RANGE_IDS.map((id) => (
        <Button
          key={id}
          asChild
          size="sm"
          variant={id === range ? "default" : "outline"}
        >
          <Link
            href={`/results?range=${id}`}
            aria-current={id === range ? "page" : undefined}
            scroll={false}
          >
            {t(`results.range_${id}`)}
          </Link>
        </Button>
      ))}
    </nav>
  )
}
