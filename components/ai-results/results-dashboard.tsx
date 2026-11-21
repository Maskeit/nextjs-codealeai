import { CompareSection } from "@/components/ai-results/compare-section"
import { OverviewCharts } from "@/components/ai-results/overview-charts"
import { ProviderSummary } from "@/components/ai-results/provider-table"
import { ResultsFilters } from "@/components/ai-results/results-filters"
import { StatTiles } from "@/components/ai-results/stat-tiles"
import { getResults, parseRange } from "@/lib/results"

export async function ResultsDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const range = parseRange((await searchParams).range)
  const data = await getResults(range)

  return (
    <div className="space-y-8">
      <ResultsFilters range={data.range} />
      <StatTiles totals={data.totals} />
      <OverviewCharts days={data.days} providers={data.providers} />

      <ProviderSummary data={data} />

      <CompareSection providers={data.providers} />
    </div>
  )
}
