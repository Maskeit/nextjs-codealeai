import { AdviceContent } from "@/components/advice/advice-content"

export default function AdvicePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <AdviceContent />
      </div>
    </div>
  )
}