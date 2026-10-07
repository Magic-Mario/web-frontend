// Identidad anónima del jugador (FR-008, Decisión 9 del research).
//
// En v1 no hay cuentas ni contraseña: el navegador genera **un UUID v4** y lo
// guarda en `localStorage`. Ese valor viaja en la cabecera `X-Player-Id` y
// nombra la vida en el servidor, de modo que la partida sobrevive a recargas
// y reinicios (SC-006) sin estado de sesión.

const STORAGE_KEY = "life.player_id";

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Genera un UUID v4 sin depender de `crypto` (fallback para entornos raros). */
function randomUuid(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versión 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

/**
 * Devuelve el identificador anónimo del jugador, creándolo si no existe.
 *
 * Devuelve cadena vacía fuera del navegador (SSR): quien necesite la cabecera
 * en el cliente la pide aquí, y el proxy server-side solo la reenvía.
 */
export function getPlayerId(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && UUID_V4_RE.test(stored)) {
    return stored;
  }
  const generated = randomUuid();
  window.localStorage.setItem(STORAGE_KEY, generated);
  return generated;
}

/** Borra la identidad: solo tiene sentido al empezar una partida nueva. */
export function clearPlayerId(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
