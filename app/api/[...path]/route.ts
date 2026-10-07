// Proxy **server-side** único hacia el backend (T027).
//
// Sustituye a los dos route handlers de finanzas. Cualquier `/api/<cualquier
// cosa>` se reenvía a `BACKEND_BASE_URL/<cualquier cosa>` conservando método,
// cuerpo, query y la cabecera `X-Player-Id`.
//
// Por qué existe (regla de la 001, `docs/LOCAL_DEV.md`):
// - **REST server-side, nada desde el navegador**: el navegador solo habla
//   con el origen de Next, nunca con el backend → sin CORS y sin exponer la
//   dirección interna del servicio.
// - El backend sigue publicando sus rutas en la raíz **y** bajo `/api`, así
//   que este prefijo es también el que publica el ALB.

import { NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? "http://backend:8000";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: { path: string[] } | Promise<{ path: string[] }>;
};

async function proxy(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await Promise.resolve(context.params);
  const incoming = new URL(request.url);

  const target = `${BACKEND_BASE_URL}/${path.join("/")}${incoming.search}`;
  const method = request.method.toUpperCase();

  const headers = new Headers();
  const playerId = request.headers.get("x-player-id");
  if (playerId) headers.set("X-Player-Id", playerId);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await request.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, { method, headers, body, cache: "no-store" });
  } catch {
    // Fallo controlado: el backend caído no tumba el frontend (SC-007).
    return NextResponse.json(
      { detail: "el backend no está disponible" },
      { status: 502 },
    );
  }

  if (upstream.status === 204) {
    return new Response(null, { status: 204 });
  }

  const payload = await upstream.text();
  return new Response(payload, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
