export type ChatMessagePart =
  | {
      type: "text"
      text: string
    }
  | {
      type: `tool-${string}`
      state: "input-available"
      input: unknown
      output?: unknown
    }

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  parts: ChatMessagePart[]
}

interface ChatWriter {
  tool(
    name: string,
    args: { input: unknown }
  ): {
    output(value: unknown): void
  }
  text(value: string): void
}

interface ChatBuilder {
  user(value: string): ChatBuilder
  assistant(build: ({ writer }: { writer: ChatWriter }) => void): ChatBuilder
  get(): ChatMessage[]
}

export function createChat(): ChatBuilder {
  const messages: ChatMessage[] = []
  let nextId = 0

  return {
    user(value) {
      messages.push({
        id: `message-${nextId++}`,
        role: "user",
        parts: [{ type: "text", text: value }],
      })
      return this
    },
    assistant(build) {
      const parts: ChatMessagePart[] = []
      const writer: ChatWriter = {
        tool(name, args) {
          const part: Extract<ChatMessagePart, { type: `tool-${string}` }> = {
            type: `tool-${name}`,
            state: "input-available",
            input: args.input,
          }
          parts.push(part)
          return {
            output(value) {
              part.output = value
            },
          }
        },
        text(value) {
          parts.push({ type: "text", text: value })
        },
      }

      build({ writer })
      messages.push({
        id: `message-${nextId++}`,
        role: "assistant",
        parts,
      })
      return this
    },
    get() {
      return messages.map((message) => ({
        ...message,
        parts: message.parts.map((part) => ({ ...part })),
      }))
    },
  }
}

export function getMessageText(message: ChatMessage): string {
  return message.parts
    .filter((part): part is Extract<ChatMessagePart, { type: "text" }> =>
      part.type === "text"
    )
    .map((part) => part.text)
    .join("")
}
