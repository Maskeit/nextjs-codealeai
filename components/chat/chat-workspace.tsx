"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { SettingsIcon } from "lucide-react"

import { useLang } from "@/components/LangProvider"
import { PromptInput } from "@/components/chat/chat-input"
import { QueueChat, type ChatEntry } from "@/components/chat/chat-messages"
import { Button } from "@/components/ui/button"
import { useChatStore, type ChatSession } from "@/lib/chat-store"
import {
  getModelErrorMessage,
  streamModelResponse,
  type ChatModelOption,
} from "@/lib/model-api"

const EMPTY_MESSAGES: ChatEntry[] = []

export function ChatWorkspace({ models }: { models: ChatModelOption[] }) {
  const { activeChat } = useChatStore()

  // Un componente por chat: al cambiar de chat se corta el stream en curso y
  // se reinicia el estado local (error, streaming).
  return (
    <ChatSessionView
      key={activeChat?.id ?? "pending"}
      chat={activeChat}
      models={models}
    />
  )
}

function ChatSessionView({
  chat,
  models,
}: {
  chat: ChatSession | undefined
  models: ChatModelOption[]
}) {
  const { state, updateSettings, setMessages } = useChatStore()
  const { t } = useLang()
  const { selectedModel, noContext } = state
  const messages = chat?.messages ?? EMPTY_MESSAGES
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState("")
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => abortControllerRef.current?.abort()
  }, [])

  useEffect(() => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: isStreaming ? "auto" : "smooth",
    })
  }, [messages, isStreaming])

  async function sendMessage(content: string, model: ChatModelOption) {
    if (abortControllerRef.current || !chat) {
      return
    }
    const chatId = chat.id

    setError("")
    const controller = new AbortController()
    abortControllerRef.current = controller
    setIsStreaming(true)

    const userMessage: ChatEntry = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    }
    const assistantId = crypto.randomUUID()
    const assistantMessage: ChatEntry = {
      id: assistantId,
      role: "assistant",
      content: "",
    }
    // Modo comparación: solo el mensaje nuevo, sin el historial del chat.
    const conversation = (noContext ? [userMessage] : [...messages, userMessage]).map(
      ({ role, content }) => ({ role, content })
    )

    setMessages(chatId, (current) => [...current, userMessage, assistantMessage])

    try {
      await streamModelResponse({
        protocol: model.protocol,
        modelId: model.id,
        messages: conversation,
        signal: controller.signal,
        onToken: (token) => {
          setMessages(chatId, (current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, content: message.content + token }
                : message
            )
          )
        },
      })
    } catch (requestError) {
      if (!controller.signal.aborted) {
        setError(getModelErrorMessage(requestError, t))
      }
      setMessages(chatId, (current) =>
        current.filter(
          (message) =>
            message.id !== assistantId || message.content.length > 0
        )
      )
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
      setIsStreaming(false)
    }
  }

  function stopResponse() {
    abortControllerRef.current?.abort()
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {models.length === 0 && (
        <div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            {t("chat.no_models_banner")}
          </span>
          <Button asChild size="sm" variant="outline">
            <Link href="/config">
              <SettingsIcon />
              {t("chat.configure")}
            </Link>
          </Button>
        </div>
      )}

      <div
        ref={messagesContainerRef}
        className="min-h-0 flex-1 overflow-y-auto scroll-smooth"
        aria-live="polite"
        aria-relevant="additions text"
      >
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4">
          <QueueChat messages={messages} isStreaming={isStreaming} />
        </div>
      </div>

      <footer className="shrink-0 bg-background px-4 pt-2 pb-4">
        <div className="mx-auto w-full max-w-3xl space-y-2">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <PromptInput
            models={models}
            selectedModel={selectedModel}
            onModelChange={(model) => updateSettings({ selectedModel: model })}
            noContext={noContext}
            onNoContextChange={(value) => updateSettings({ noContext: value })}
            onSend={(content, model) => void sendMessage(content, model)}
            onStop={stopResponse}
            isStreaming={isStreaming}
          />
          <p className="text-center text-xs text-muted-foreground">
            {t("chat.disclaimer")}
          </p>
        </div>
      </footer>
    </div>
  )
}
