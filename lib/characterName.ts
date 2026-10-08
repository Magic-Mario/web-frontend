// Nombre del personaje, guardado **solo en el navegador**.
//
// El contrato de creación es cerrado (`CreateLifeRequest` con
// `additionalProperties: false`) y `Life` no tiene campo de nombre, así que
// el nombre no viaja al backend: se queda en `localStorage`, junto a la
// identidad anónima de `lib/playerId.ts`, y se pinta en la cabecera del HUD.
// Al reiniciar la partida se borra con el resto del rastro (SC-004).

const STORAGE_KEY = "life.player_name";

/** Longitud máxima que se pinta en la interfaz (evita cabeceras desbordadas). */
const MAX_LENGTH = 32;

/** Lee el nombre del personaje (cadena vacío si aún no hay ninguno). */
export function getCharacterName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

/** Guarda el nombre recién escrito en el formulario de nacimiento. */
export function setCharacterName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, name.trim().slice(0, MAX_LENGTH));
}

/** Borra el nombre: sólo al empezar una partida nueva. */
export function clearCharacterName(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
