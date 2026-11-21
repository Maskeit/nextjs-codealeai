"use client";
import { createContext, useContext, useEffect, useState } from "react";
import es from "@/locales/es.json";
import en from "@/locales/en.json";

type Lang = "es" | "en";
const dicts = { es, en };

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: string, vars?: Record<string, string | number>) => string }>(null!);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("es");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    const browser = navigator.language.startsWith("en") ? "en" : "es";
    setLang(saved ?? browser);
  }, []);

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // t("nav.delete_chat", { title }) reemplaza {title} en el texto.
  const t = (key: string, vars?: Record<string, string | number>) => {
    const text: string =
      key.split(".").reduce((o: any, k) => o?.[k], dicts[lang]) ?? key;
    return vars
      ? text.replace(/\{(\w+)\}/g, (m, name) => String(vars[name] ?? m))
      : text;
  };

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);