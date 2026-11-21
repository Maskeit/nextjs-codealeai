import { ProvidersEmpty } from "@/components/config/config-header"
import { ProviderCard } from "@/components/config/provider-card"
import { listProviders } from "@/lib/providers"

export async function ProvidersSection() {
  const providers = await listProviders()

  return (
    <div className="space-y-6">
      {providers.length === 0 && <ProvidersEmpty />}
      {providers.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
      <ProviderCard />
    </div>
  )
}
