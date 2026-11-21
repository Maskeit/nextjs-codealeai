"use client"

import { useTransition } from "react"
import { PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"

import { deleteModel, saveModel } from "@/app/config/actions"
import { useLang } from "@/components/LangProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFormAction } from "@/hooks/use-form-action"
import type { ModelView } from "@/lib/providers"

interface ModelRowProps {
  providerId: string
  model?: ModelView
}

export const MODEL_GRID =
  "md:grid md:grid-cols-[1.3fr_1.3fr_8rem_8rem_auto] md:items-center"

// Una fila editable por modelo; sin `model` es la fila para añadir uno nuevo.
export function ModelRow({ providerId, model }: ModelRowProps) {
  const { t } = useLang()
  const { state, pending, formRef, onSubmit } = useFormAction(saveModel)
  const [removing, startRemove] = useTransition()

  function remove() {
    if (!model) return
    if (
      !window.confirm(
        t("config.models.delete_confirm", { name: model.displayName })
      )
    ) {
      return
    }
    startRemove(() => deleteModel(model.id))
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className={`space-y-2 md:space-y-0 md:gap-2 ${MODEL_GRID}`}
    >
      <input type="hidden" name="id" value={model?.id ?? ""} />
      <input type="hidden" name="providerId" value={providerId} />
      <Input
        name="apiModelId"
        defaultValue={model?.apiModelId}
        placeholder={t("config.models.api_id_placeholder")}
        aria-label={t("config.models.api_id_label")}
        spellCheck={false}
        required
      />
      <Input
        name="displayName"
        defaultValue={model?.displayName}
        placeholder={t("config.models.display_name_placeholder")}
        aria-label={t("config.models.display_name_label")}
      />
      <Input
        name="inputPricePerMTok"
        type="number"
        min="0"
        step="any"
        defaultValue={model?.inputPricePerMTok ?? 0}
        aria-label={t("config.models.input_price_label")}
      />
      <Input
        name="outputPricePerMTok"
        type="number"
        min="0"
        step="any"
        defaultValue={model?.outputPricePerMTok ?? 0}
        aria-label={t("config.models.output_price_label")}
      />
      <div className="flex items-center gap-1">
        <Button
          type="submit"
          size="icon-sm"
          variant={model ? "outline" : "default"}
          disabled={pending}
          aria-label={model ? t("config.models.save") : t("config.models.add")}
        >
          {model ? <SaveIcon /> : <PlusIcon />}
        </Button>
        {model && (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={removing}
            onClick={remove}
            aria-label={t("config.models.delete")}
          >
            <Trash2Icon />
          </Button>
        )}
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-xs text-destructive md:col-span-5">
          {t(`config.messages.${state.message}`)}
        </p>
      )}
    </form>
  )
}
