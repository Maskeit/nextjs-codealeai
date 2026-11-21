"use client"

import * as React from "react"

import type { ChatEntry } from "@/components/chat/chat-messages"

const STORAGE_KEY = "codealeai:state:v1"
const CHANGE_EVENT = "codealeai:state-change"

export interface ChatSettings {
  // Id del modelo en SQLite ("" = ninguno elegido todavía)
  selectedModel: string
  // Modo comparación: cada petición se envía sin el historial del chat
  noContext: boolean
}

export interface ChatSession {
  id: string
  createdAt: number
  messages: ChatEntry[]
}

export interface ChatState extends ChatSettings {
  // Más recientes primero
  chats: ChatSession[]
  activeChatId: string
}

const defaultState: ChatState = {
  selectedModel: "",
  noContext: false,
  chats: [],
  activeChatId: "",
}

function createSession(messages: ChatEntry[] = []): ChatSession {
  return { id: crypto.randomUUID(), createdAt: Date.now(), messages }
}

function isChatEntry(value: unknown): value is ChatEntry {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const entry = value as Record<string, unknown>
  return (
    typeof entry.id === "string" &&
    (entry.role === "user" || entry.role === "assistant") &&
    typeof entry.content === "string"
  )
}

function parseSession(value: unknown): ChatSession | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined
  }
  const session = value as Record<string, unknown>
  if (typeof session.id !== "string" || !Array.isArray(session.messages)) {
    return undefined
  }
  return {
    id: session.id,
    createdAt:
      typeof session.createdAt === "number" ? session.createdAt : Date.now(),
    messages: session.messages.filter(isChatEntry),
  }
}

function parseState(raw: string | null): ChatState {
  if (!raw) {
    return defaultState
  }
  try {
    const stored = JSON.parse(raw) as Record<string, unknown>
    let chats: ChatSession[] = []
    if (Array.isArray(stored.chats)) {
      chats = stored.chats.flatMap((item) => parseSession(item) ?? [])
    } else if (Array.isArray(stored.messages)) {
      // Formato anterior: un único chat guardado en `messages`
      const messages = stored.messages.filter(isChatEntry)
      if (messages.length > 0) {
        chats = [createSession(messages)]
      }
    }
    const activeChatId =
      typeof stored.activeChatId === "string" &&
      chats.some((chat) => chat.id === stored.activeChatId)
        ? stored.activeChatId
        : (chats[0]?.id ?? "")
    return {
      selectedModel:
        typeof stored.selectedModel === "string" ? stored.selectedModel : "",
      noContext: stored.noContext === true,
      chats,
      activeChatId,
    }
  } catch {
    return defaultState
  }
}

// Caches the parsed state per raw string so streaming tokens don't re-parse
// unchanged data and useSyncExternalStore gets a stable snapshot.
let cachedRaw: string | null | undefined
let cachedState: ChatState = defaultState

function readState(): ChatState {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedState = parseState(raw)
  }
  return cachedState
}

function writeState(next: ChatState) {
  const raw = JSON.stringify(next)
  try {
    window.localStorage.setItem(STORAGE_KEY, raw)
  } catch {
    // Storage can be full or disabled; keep the in-memory state usable.
  }
  cachedRaw = raw
  cachedState = next
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

function subscribeHydration() {
  return () => {}
}

interface ChatStoreValue {
  state: ChatState
  hydrated: boolean
  activeChat: ChatSession | undefined
  updateSettings: (settings: Partial<ChatSettings>) => void
  // Crea un chat nuevo y lo activa. Si el activo ya está vacío, lo reutiliza.
  createChat: () => string
  selectChat: (chatId: string) => void
  // Borra el chat con todos sus mensajes (su "memoria")
  deleteChat: (chatId: string) => void
  // Atada a un chat concreto para que un stream en curso no escriba en otro
  setMessages: (
    chatId: string,
    action: React.SetStateAction<ChatEntry[]>
  ) => void
}

const ChatStoreContext = React.createContext<ChatStoreValue | null>(null)

function createChat(): string {
  const current = readState()
  const active = current.chats.find((chat) => chat.id === current.activeChatId)
  if (active && active.messages.length === 0) {
    return active.id
  }
  const session = createSession()
  writeState({
    ...current,
    chats: [session, ...current.chats],
    activeChatId: session.id,
  })
  return session.id
}

export function ChatStoreProvider({ children }: { children: React.ReactNode }) {
  const state = React.useSyncExternalStore(
    subscribe,
    readState,
    () => defaultState
  )
  const hydrated = React.useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false
  )

  // Garantiza que siempre haya un chat activo en el cliente.
  React.useEffect(() => {
    if (readState().chats.length === 0) {
      createChat()
    }
  }, [])

  const updateSettings = React.useCallback((settings: Partial<ChatSettings>) => {
    writeState({ ...readState(), ...settings })
  }, [])

  const selectChat = React.useCallback((chatId: string) => {
    const current = readState()
    if (
      current.activeChatId !== chatId &&
      current.chats.some((chat) => chat.id === chatId)
    ) {
      writeState({ ...current, activeChatId: chatId })
    }
  }, [])

  const deleteChat = React.useCallback((chatId: string) => {
    const current = readState()
    const index = current.chats.findIndex((chat) => chat.id === chatId)
    if (index === -1) {
      return
    }
    const chats = current.chats.filter((chat) => chat.id !== chatId)
    if (chats.length === 0) {
      const session = createSession()
      writeState({ ...current, chats: [session], activeChatId: session.id })
      return
    }
    const activeChatId =
      current.activeChatId === chatId
        ? chats[Math.min(index, chats.length - 1)].id
        : current.activeChatId
    writeState({ ...current, chats, activeChatId })
  }, [])

  const setMessages = React.useCallback<ChatStoreValue["setMessages"]>(
    (chatId, action) => {
      const current = readState()
      if (!current.chats.some((chat) => chat.id === chatId)) {
        // El chat se borró mientras llegaba la respuesta.
        return
      }
      writeState({
        ...current,
        chats: current.chats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages:
                  typeof action === "function"
                    ? action(chat.messages)
                    : action,
              }
            : chat
        ),
      })
    },
    []
  )

  const activeChat = state.chats.find((chat) => chat.id === state.activeChatId)

  const value = React.useMemo(
    () => ({
      state,
      hydrated,
      activeChat,
      updateSettings,
      createChat,
      selectChat,
      deleteChat,
      setMessages,
    }),
    [state, hydrated, activeChat, updateSettings, selectChat, deleteChat, setMessages]
  )

  return (
    <ChatStoreContext.Provider value={value}>
      {children}
    </ChatStoreContext.Provider>
  )
}

export function useChatStore() {
  const context = React.useContext(ChatStoreContext)
  if (!context) {
    throw new Error("useChatStore must be used within ChatStoreProvider.")
  }
  return context
}

// Título del chat: el primer mensaje del usuario, recortado.
export function getChatTitle(chat: ChatSession, emptyTitle: string): string {
  const first = chat.messages.find((message) => message.role === "user")
  if (!first) {
    return emptyTitle
  }
  const text = first.content.replace(/\s+/g, " ").trim()
  return text.length > 40 ? `${text.slice(0, 40)}…` : text
}
