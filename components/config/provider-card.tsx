"use client"

import { useState, useTransition } from "react"

import {
  clearProviderKey,
  deleteProvider,
  saveProvider,
  setProviderActive,
} from "@/app/config/actions"
import { useLang } from "@/components/LangProvider"
import { MODEL_GRID, ModelRow } from "@/components/config/model-row"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFormAction } from "@/hooks/use-form-action"
import type { ProviderView } from "@/lib/providers"

// Sin `provider` el formulario crea uno nuevo.
export function ProviderCard({ provider }: { provider?: ProviderView }) {
  const { t } = useLang()
  const { state, pending, formRef, onSubmit } = useFormAction(saveProvider)
  const [showKey, setShowKey] = useState(false)
  const [busy, startAction] = useTransition()

  function removeProvider() {
    if (!provider) return
    if (
      !window.confirm(
        t("config.provider.delete_confirm", { name: provider.name })
      )
    ) {
      return
    }
    startAction(() => deleteProvider(provider.id))
  }

  return (
    <Card className={provider && !provider.isActive ? "opacity-70" : undefined}>
      <CardHeader>
        <CardTitle>{provider ? provider.name : t("config.provider.new_title")}</CardTitle>
        <CardDescription>
          {provider
            ? provider.baseUrl
            : t("config.provider.new_description")}
        </CardDescription>
        {provider && (
          <CardAction className="flex items-center gap-2">
            <Badge variant="outline">{provider.protocol}</Badge>
            <Badge variant={provider.hasKey ? "secondary" : "outline"}>
              {provider.hasKey
                ? t("config.provider.key_badge", { hint: provider.keyHint ?? "" })
                : t("config.provider.no_key")}
            </Badge>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="space-y-4"
          id={`provider-${provider?.id ?? "new"}`}
        >
          <input type="hidden" name="id" value={provider?.id ?? ""} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>{t("config.provider.name")}</FieldLabel>
              <Input name="name" defaultValue={provider?.name} required />
            </Field>
            <Field>
              <FieldLabel>{t("config.provider.protocol")}</FieldLabel>
              <Select name="protocol" defaultValue={provider?.protocol ?? "openai"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">
                    {t("config.provider.protocol_openai")}
                  </SelectItem>
                  <SelectItem value="anthropic">
                    {t("config.provider.protocol_anthropic")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel>{t("config.provider.base_url")}</FieldLabel>
            <Input
              name="baseUrl"
              type="url"
              defaultValue={provider?.baseUrl}
              placeholder={t("config.provider.base_url_placeholder")}
              spellCheck={false}
              required
            />
          </Field>

          <Field>
            <FieldLabel>{t("config.provider.api_key")}</FieldLabel>
            <div className="flex gap-2">
              <Input
                name="apiKey"
                type={showKey ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                placeholder={
                  provider?.hasKey
                    ? t("config.provider.api_key_placeholder_saved")
                    : t("config.provider.api_key_placeholder_new")
                }
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowKey((value) => !value)}
              >
                {showKey ? t("config.provider.hide") : t("config.provider.show")}
              </Button>
            </div>
            <FieldDescription>
              {t("config.provider.api_key_hint")}
            </FieldDescription>
          </Field>

          <details className="rounded-lg border px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium">
              {t("config.provider.advanced")}
            </summary>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel>{t("config.provider.auth_header")}</FieldLabel>
                  <Input
                    name="authHeader"
                    defaultValue={provider?.authHeader ?? "Authorization"}
                    spellCheck={false}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>{t("config.provider.auth_scheme")}</FieldLabel>
                  <Input
                    name="authScheme"
                    defaultValue={provider ? (provider.authScheme ?? "") : "Bearer"}
                    placeholder={t("config.provider.auth_scheme_placeholder")}
                    spellCheck={false}
                  />
                </Field>
                <Field>
                  <FieldLabel>{t("config.provider.max_tokens")}</FieldLabel>
                  <Input
                    name="maxTokens"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={provider?.maxTokens ?? 4096}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel>{t("config.provider.extra_headers")}</FieldLabel>
                <Input
                  name="extraHeaders"
                  defaultValue={provider?.extraHeaders ?? ""}
                  placeholder='{"anthropic-version":"2023-06-01"}'
                  spellCheck={false}
                />
              </Field>
            </div>
          </details>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {provider ? t("config.provider.save") : t("config.provider.create")}
            </Button>
            {state.status !== "idle" && (
              <span
                role={state.status === "error" ? "alert" : "status"}
                className={
                  state.status === "error"
                    ? "text-sm text-destructive"
                    : "text-sm text-muted-foreground"
                }
              >
                {t(`config.messages.${state.message}`)}
              </span>
            )}
          </div>
        </form>

        {provider && (
          <section className="space-y-3 border-t pt-6">
            <div>
              <h3 className="text-sm font-medium">{t("config.models.title")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("config.models.description")}
              </p>
            </div>
            <div
              className={`hidden gap-2 text-xs text-muted-foreground ${MODEL_GRID}`}
            >
              <span>{t("config.models.col_api_id")}</span>
              <span>{t("config.models.col_display_name")}</span>
              <span>{t("config.models.col_input")}</span>
              <span>{t("config.models.col_output")}</span>
              <span className="w-[4.5rem]" />
            </div>
            <div className="space-y-4 md:space-y-2">
              {provider.models.map((model) => (
                <ModelRow key={model.id} providerId={provider.id} model={model} />
              ))}
              <ModelRow providerId={provider.id} />
            </div>
          </section>
        )}
      </CardContent>

      {provider && (
        <CardFooter className="flex flex-wrap justify-between gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                startAction(() =>
                  setProviderActive(provider.id, !provider.isActive)
                )
              }
            >
              {provider.isActive
                ? t("config.provider.deactivate")
                : t("config.provider.activate")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || !provider.hasKey}
              onClick={() => startAction(() => clearProviderKey(provider.id))}
            >
              {t("config.provider.clear_key")}
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={busy}
            onClick={removeProvider}
          >
            {t("config.provider.delete")}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
