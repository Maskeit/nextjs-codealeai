// Color por proveedor: paleta categórica validada (claro y oscuro) en orden
// fijo. El color sigue a la entidad (el proveedor), nunca a su ranking: se
// asigna por orden de creación, así filtrar no repinta a los demás.
// Más de 8 proveedores: los extra usan gris (nunca se cicla un tono).
const SLOTS = [
  { light: "#2a78d6", dark: "#3987e5" }, // azul
  { light: "#eb6834", dark: "#d95926" }, // naranja
  { light: "#1baf7a", dark: "#199e70" }, // aqua
  { light: "#eda100", dark: "#c98500" }, // amarillo
  { light: "#e87ba4", dark: "#d55181" }, // magenta
  { light: "#008300", dark: "#0ca30c" }, // verde
  { light: "#6250d6", dark: "#9085e9" }, // violeta
  { light: "#e34948", dark: "#e66767" }, // rojo
]

const FALLBACK = { light: "#898781", dark: "#898781" }

export interface ProviderColor {
  light: string
  dark: string
}

export function providerColor(index: number): ProviderColor {
  return SLOTS[index] ?? FALLBACK
}

// Mismo tono, más claro: para distinguir salida de entrada dentro del proveedor.
export function tint(color: ProviderColor, percent = 50): ProviderColor {
  const mix = (hex: string) =>
    `color-mix(in srgb, ${hex} ${percent}%, transparent)`
  return { light: mix(color.light), dark: mix(color.dark) }
}

// Clave estable de serie para ChartConfig / `var(--color-<clave>)`.
export const providerKey = (index: number) => `p${index}`
