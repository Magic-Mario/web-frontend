// Cliente REST del juego de simulación de vida (T026).
//
// Regla heredada de la 001: **REST server-side, nada desde el navegador**.
// Este módulo solo se usa en componentes cliente y llama a `/api/...` (mismo
// origen): el route handler `app/api/[...path]/route.ts` reenvía la petición
// a `BACKEND_BASE_URL` desde el servidor. Así el navegador no habla nunca
// directamente con el backend ni necesita CORS.
//
// Identidad anónima (FR-008): la cabecera `X-Player-Id` sale de
// `lib/playerId.ts` — un UUID v4 que genera el navegador — y nombra la vida
// en el servidor.

import { getPlayerId } from "@/lib/playerId";

// --- enums del contrato ----------------------------------------------------

export type Gender = "MALE" | "FEMALE";
export type Granularity = "YEAR" | "MONTH";
export type LifeStatus = "ALIVE" | "DEAD";
export type CauseOfDeath = "HEALTH_ZERO" | "FATAL_OPTION" | "FATAL_RANDOM";
export type Relation = "FATHER" | "MOTHER" | "SIBLING" | "FRIEND" | "PARTNER";
export type PersonState =
  | "ALIVE"
  | "DEAD"
  | "TOGETHER"
  | "SEPARATED"
  | "ESTRANGED";
/** FR-003: los tres tipos del rediseño (sentimental se funde en RELATIONSHIPS). */
export type EventType = "MAIN" | "DAILY" | "RELATIONSHIPS";
export type EventSource = "WIKIPEDIA" | "SEED";

// --- schemas del contrato --------------------------------------------------

export interface Stats {
  health: number;
  happiness: number;
  intelligence: number;
  looks: number;
}

export interface PersonaCercana {
  name: string;
  relation: Relation;
  state: PersonState;
  /** FR-018: gauge oculta 0–100 de calidad de la relación (no editable). */
  relationship?: number;
}

export interface Life {
  player_id: string;
  gender: Gender;
  country: string;
  city: string;
  birth_year: number;
  granularity: Granularity;
  age_months: number;
  current_year: number;
  stats: Stats;
  status: LifeStatus;
  cause_of_death?: CauseOfDeath | null;
  people: PersonaCercana[];
  /**
   * Suceso del período en curso que todavía no se decidió (SC-006).
   * Sólo lo devuelve `GET /lives`: tras recargar se pinta en vez de perderlo,
   * porque mientras haya algo pendiente el avance responde `409`.
   */
  pending_event?: PresentedEvent | null;
}

export interface CreateLifeInput {
  gender: Gender;
  country: string;
  city: string;
  birth_year: number;
  granularity?: Granularity;
}

export interface EventOption {
  id: string;
  label: string;
  fatal?: boolean;
}

export interface PresentedEvent {
  id: string;
  type: EventType;
  text: string;
  year?: number;
  source?: EventSource;
  /** FR-002: país del suceso. */
  country?: string;
  options: EventOption[];
}

export interface AdvanceResponse {
  life: Life;
  /** Edad en años cumplidos al abrir el período. */
  age_years: number;
  /** FR-007: el lote del período, de 1 a 3 sucesos, resueltos en orden. */
  events: PresentedEvent[];
  /** `false` justo tras avanzar: el avance **abre** el período. */
  period_complete: boolean;
  derived?: Partial<Stats>;
}

export interface DecisionResponse {
  life: Life;
  deltas: Partial<Stats>;
  dead: boolean;
  cause_of_death?: CauseOfDeath | null;
  /** `true` cuando esta decisión resolvió el último suceso del período. */
  period_complete: boolean;
}

export interface SystemDigest {
  events?: number;
  decisions?: number;
  highlights?: string[];
}

export interface LifeSummary {
  age_reached: number;
  cause_of_death: CauseOfDeath;
  by_system: {
    education: SystemDigest;
    work: SystemDigest;
    relationships: SystemDigest;
  };
}

/**
 * Una entrada del histórico de sucesos ya vividos (`GET /lives/events`).
 * `option_label` trae la etiqueta de la opción elegida y `deltas` el cambio
 * que aplicó sobre las stats (SC-003).
 */
export interface EventHistoryItem {
  /** Nº de evento: el orden cronológico del histórico es `seq` ascendente. */
  seq: number;
  period_index: number;
  age_months: number;
  age_years: number;
  event_id: string;
  type: EventType;
  text: string;
  option_id: string;
  option_label: string;
  deltas: Partial<Stats>;
  fatal: boolean;
  source: EventSource;
}

/** Histórico cronológico de sucesos de la vida en curso. */
export interface EventHistory {
  player_id: string;
  count: number;
  events: EventHistoryItem[];
}

export interface BirthCountry {
  code: string;
  name: string;
  cities: string[];
}

export interface BirthCatalog {
  countries: BirthCountry[];
}

/** Error HTTP del contrato (`Error` / `ValidationError`): `{ detail: string }`. */
export class ApiError extends Error {
  readonly status: number;
  /** El `detail` del cuerpo de error, listo para enseñarlo en la interfaz. */
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

// --- transporte ------------------------------------------------------------

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("X-Player-Id", getPlayerId());
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "no se pudo contactar con el servidor");
  }

  if (!response.ok) {
    let detail = `el servidor respondió ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (typeof body?.detail === "string" && body.detail) detail = body.detail;
    } catch {
      // Respuesta sin cuerpo: nos quedamos con el texto genérico.
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// --- operaciones -----------------------------------------------------------

/** Crea la vida (FR-001). `422` datos inválidos · `409` ya existe una partida. */
export function createLife(input: CreateLifeInput): Promise<Life> {
  return request<Life>("/lives", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Retoma la vida en curso (FR-008). `404` si todavía no hay partida. */
export function getLife(): Promise<Life> {
  return request<Life>("/lives");
}

/** Elimina la vida para empezar otra (FR-005). `404` si no hay partida. */
export function deleteLife(): Promise<void> {
  return request<void>("/lives", { method: "DELETE" });
}

/** Abre el período y devuelve su lote de sucesos (FR-002, FR-007). */
export function advanceLife(): Promise<AdvanceResponse> {
  return request<AdvanceResponse>("/lives/advance", { method: "POST" });
}

/**
 * Resuelve **un** suceso del lote (FR-007).
 *
 * El contrato exige mandar el `event_id` del suceso pendiente además de la
 * opción: así el servidor puede rechazar una decisión que llegue tarde o fuera
 * de orden en vez de aplicarla sobre el suceso equivocado.
 */
export function submitDecision(
  eventId: string,
  optionId: string,
): Promise<DecisionResponse> {
  return request<DecisionResponse>("/lives/decision", {
    method: "POST",
    body: JSON.stringify({ event_id: eventId, option_id: optionId }),
  });
}

/** Resumen de fin de vida (FR-005). `409` si la vida sigue en curso. */
export function getSummary(): Promise<LifeSummary> {
  return request<LifeSummary>("/lives/summary");
}

/** Catálogo acotado de países y ciudades (FR-001). */
export function getBirthCatalog(): Promise<BirthCatalog> {
  return request<BirthCatalog>("/catalog/birth");
}

/**
 * Histórico cronológico de los sucesos ya vividos (historial del juego).
 *
 * `404` si todavía no hay partida; si el backend aún no publica la ruta, el
 * caller captura el error y pinta el panel vacío sin romper el resto del
 * juego (la partida sigue jugándose con las demás operaciones).
 */
export function getLifeEvents(): Promise<EventHistory> {
  return request<EventHistory>("/lives/events");
}
