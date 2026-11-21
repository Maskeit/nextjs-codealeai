import { Suspense } from "react"

import { ConfigHeader } from "@/components/config/config-header"
import { ProvidersSection } from "@/components/config/providers-section"
import { Skeleton } from "@/components/ui/skeleton"

export default function ConfigurationPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <ConfigHeader />

        <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
          <ProvidersSection />
        </Suspense>
      </div>
    </div>
  )
}
