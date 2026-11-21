"use client"

import * as React from "react"
import { ArrowUpIcon, ChevronDownIcon, HistoryIcon, SquareIcon } from "lucide-react"

import { useLang } from "@/components/LangProvider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import type { ChatModelOption } from "@/lib/model-api"

interface PromptInputProps {
  models: ChatModelOption[]
  selectedModel: string
  onModelChange: (model: string) => void
  noContext: boolean
  onNoContextChange: (value: boolean) => void
  onSend: (content: string, model: ChatModelOption) => void
  onStop: () => void
  isStreaming: boolean
}

export function PromptInput({
  models,
  selectedModel,
  onModelChange,
  noContext,
  onNoContextChange,
  onSend,
  onStop,
  isStreaming,
}: PromptInputProps) {
  const { t } = useLang()
  const [text, setText] = React.useState("")
  const formRef = React.useRef<HTMLFormElement>(null)
  const currentModel =
    models.find((item) => item.id === selectedModel) ?? models[0]
  const canSend = text.trim().length > 0 && Boolean(currentModel)
  // Agrupa por proveedor conservando el orden de la lista
  const groups = models.reduce<{ id: string; label: string; items: ChatModelOption[] }[]>(
    (acc, model) => {
      const group = acc.find((item) => item.id === model.providerId)
      if (group) group.items.push(model)
      else
        acc.push({ id: model.providerId, label: model.providerName, items: [model] })
      return acc
    },
    []
  )

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = text.trim()
    if (!content || isStreaming || !currentModel) {
      return
    }

    onSend(content, currentModel)
    setText("")
  }

  return (
    <form ref={formRef} onSubmit={submit} className="mx-auto w-full max-w-3xl">
      <InputGroup className="rounded-3xl border bg-background shadow-sm">
        <InputGroupTextarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("chat.input_text")}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              formRef.current?.requestSubmit()
            }
          }}
          className="min-h-14 max-h-48 px-4 py-4"
          aria-label={t("chat.input_label")}
        />
        <InputGroupAddon align="block-end" className="px-3 pb-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <InputGroupButton
                size="sm"
                variant="outline"
                aria-label={t("chat.model_label", {
                  model: currentModel?.name ?? t("chat.model_none"),
                })}
                disabled={models.length === 0}
              >
                {currentModel?.name ?? t("chat.no_models_option")}
                <ChevronDownIcon />
              </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {groups.map((group, index) => (
                <React.Fragment key={group.id}>
                  {index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={currentModel?.id ?? ""}
                      onValueChange={onModelChange}
                    >
                      {group.items.map((model) => (
                        <DropdownMenuRadioItem
                          key={model.id}
                          value={model.id}
                        >
                          {model.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <InputGroupButton
            size="sm"
            variant={noContext ? "default" : "outline"}
            aria-pressed={noContext}
            title={
              noContext ? t("chat.no_context_title") : t("chat.with_context_title")
            }
            onClick={() => onNoContextChange(!noContext)}
          >
            <HistoryIcon />
            {noContext ? t("chat.no_context") : t("chat.with_context")}
          </InputGroupButton>
          <span className="ml-auto mr-2 hidden text-xs text-muted-foreground sm:inline">
            {t("chat.input_span")}
          </span>
          {isStreaming ? (
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              className="rounded-full"
              aria-label={t("chat.stop")}
              onClick={onStop}
            >
              <SquareIcon />
            </Button>
          ) : (
            <InputGroupButton
              type="submit"
              size="icon-sm"
              variant="default"
              className="rounded-full"
              disabled={!canSend}
              aria-label={t("chat.send")}
            >
              <ArrowUpIcon />
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}
