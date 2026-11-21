import { Suspense } from "react"

import { ResultsHeader } from "@/components/ai-results/results-header"
import { ResultsDashboard } from "@/components/ai-results/results-dashboard"
import { Skeleton } from "@/components/ui/skeleton"

export default function ResultsPage(props: PageProps<"/results">) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
        <ResultsHeader />

        <Suspense
          fallback={
            <div className="space-y-6">
              <Skeleton className="h-8 w-72" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-72 rounded-xl" />
            </div>
          }
        >
          <ResultsDashboard searchParams={props.searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
