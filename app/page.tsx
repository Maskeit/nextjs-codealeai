import { Suspense } from "react"

import { ChatWorkspace } from "@/components/chat/chat-workspace"
import { Skeleton } from "@/components/ui/skeleton"
import { listChatModels } from "@/lib/providers"

async function ChatWithModels() {
  const models = await listChatModels()
  return <ChatWorkspace models={models} />
}

export default function Home() {
  return (
    <Suspense fallback={<Skeleton className="m-4 h-24 rounded-2xl" />}>
      <ChatWithModels />
    </Suspense>
  )
}
