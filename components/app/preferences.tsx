"use client"

import { GlobeIcon, MoonIcon } from "lucide-react"

import { useLang } from "@/components/LangProvider"
import { useTheme } from "@/components/ThemeProvider"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export function LanguageSelect() {
  const { lang, setLang, t } = useLang()

  return (
    <Select value={lang} onValueChange={(value) => setLang(value as "es" | "en")}>
      <SelectTrigger size="sm" className="w-36" aria-label={t("settings.language")}>
        <GlobeIcon className="size-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="es">{t("settings.language_es")}</SelectItem>
        <SelectItem value="en">{t("settings.language_en")}</SelectItem>
      </SelectContent>
    </Select>
  )
}

export function ThemeSwitch() {
  const { dark, setDark } = useTheme()
  const { t } = useLang()

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="theme-switch"
        size="sm"
        checked={dark}
        onCheckedChange={setDark}
      />
      <Label htmlFor="theme-switch" className="gap-1.5 text-sm font-normal">
        <MoonIcon className="size-4 text-muted-foreground" />
        {t("settings.dark_mode")}
      </Label>
    </div>
  )
}

// Idioma + modo oscuro, juntos para la barra del chat y la página de configuración.
export function Preferences() {
  return (
    <div className="flex items-center gap-4">
      <LanguageSelect />
      <ThemeSwitch />
    </div>
  )
}
