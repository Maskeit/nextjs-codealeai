"use client"

import { useLang } from "@/components/LangProvider"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Message, MessageContent, MessageGroup } from "@/components/ui/message"
import type { ModelMessage } from "@/lib/model-api"

export interface ChatEntry extends ModelMessage {
  id: string
}

interface QueueChatProps {
  messages: ChatEntry[]
  isStreaming: boolean
}

export function QueueChat({ messages, isStreaming }: QueueChatProps) {
  const { t } = useLang()

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("chat.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("chat.subtitle")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <MessageGroup className="mx-auto w-full max-w-3xl gap-6 py-6">
      {messages.map((message, index) => {
        const streamingResponse =
          isStreaming &&
          message.role === "assistant" &&
          index === messages.length - 1

        if (message.role === "user") {
          return (
            <Message key={message.id} align="end">
              <MessageContent className="max-w-[85%]">
                <Bubble align="end" variant="muted">
                  <BubbleContent className="whitespace-pre-wrap">
                    {message.content}
                  </BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          )
        }

        return (
          <Message key={message.id}>
            <MessageContent className="max-w-full">
              {message.content ? (
                <div className="whitespace-pre-wrap leading-7">
                  {message.content}
                </div>
              ) : (
                <div
                  aria-label={streamingResponse ? t("chat.generating") : undefined}
                  className="flex h-7 items-center gap-1"
                >
                  <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
                  <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              )}
            </MessageContent>
          </Message>
        )
      })}
    </MessageGroup>
  )
}
