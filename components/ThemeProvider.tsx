"use client";
import { createContext, useContext, useEffect, useState } from "react";

const Ctx = createContext<{ dark: boolean; setDark: (dark: boolean) => void }>(null!);

// Script inline para <head>: aplica la clase "dark" antes de pintar y evita el parpadeo.
export const themeInitScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDarkState] = useState(false);

  // El script del <head> ya decidió el tema; aquí solo se sincroniza el estado.
  useEffect(() => {
    setDarkState(document.documentElement.classList.contains("dark"));
  }, []);

  const setDark = (value: boolean) => {
    setDarkState(value);
    document.documentElement.classList.toggle("dark", value);
    localStorage.setItem("theme", value ? "dark" : "light");
  };

  return <Ctx.Provider value={{ dark, setDark }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
