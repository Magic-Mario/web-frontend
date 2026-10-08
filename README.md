# cloud-project-frontend

Interfaz del **simulador de vida** (TypeScript + Next.js 16 + React 19 + `bun`).
Habla con el backend **solo por REST server-side** (`lib/api.ts` + el único
route handler `app/api/[...path]`); nada de gRPC en el navegador y ningún
acceso directo a almacenamiento.

Sustituye por completo a la UI de finanzas de la 001: ya no hay `MovementForm`,
`MovementList` ni `Balance`, y el route handler de `/api/balance` pasó a ser el
proxy genérico.

## Layout

- `app/page.tsx` — la única página. Tres fases: `loading` (se retoma la partida
  con `GET /lives`), `birth` (`BirthForm`) y `life` (`LifeView`). Al morir
  muestra `DeathSummary`, y «Empezar de nuevo» borra la partida con
  `DELETE /lives` y vuelve al formulario (SC-004).
- `app/api/[...path]/route.ts` — **proxy único** hacia el backend (T027):
  reenvía método, cuerpo, query y la cabecera `X-Player-Id` a
  `BACKEND_BASE_URL/<ruta>` (por defecto `http://backend:8000`; en local se
  pasa `BACKEND_BASE_URL=http://localhost:8000`). Así el navegador solo habla
  con el origen de Next: sin CORS y sin exponer la dirección interna del
  servicio, y el backend sigue publicando sus rutas también bajo `/api`.
- `components/` — `BirthForm`, `LifeView`, `StatsBar`, `PeopleList`,
  `EventCard`, `DeathSummary`.
- `lib/api.ts` — cliente REST y tipos del contrato (`Life`, `PresentedEvent`,
  `LifeSummary`, `ApiError`…).
- `lib/playerId.ts` — UUID v4 anónimo por jugador (FR-008), generado en el
  navegador y enviado como `X-Player-Id`.
- `contracts.version` — tag del contrato fijado (`contracts/v2.0.0`).
- `vendor/openapi.yaml` — copia **byte idéntica** de `git show
  contracts/v2.0.0:contracts/openapi.yaml` (FR-006); cambia en el mismo PR que
  suba `contracts.version`.
- `k8s/` — `deployment.yaml` (app Next en 3000 + sidecar nginx TLS en 80/443),
  `service.yaml`, `nodeport.yaml`, `configmap-nginx.yaml`, `endpoints.yaml`
  (puente cross-cluster hacia el NodePort del backend).
- `.github/workflows/deploy.yaml` — check de vendorizado + buildx → push ECR
  (`:sha`, `:semver`) → `kubectl apply` → smoke + health check cruzado del
  backend con reversión (puerta SC-007).

## Uso local

```bash
bun install --frozen-lockfile
bun run build                                  # compila sin errores

# en desarrollo, apuntando al backend local:
BACKEND_BASE_URL=http://localhost:8000 bun run dev
```

Ver `docs/LOCAL_DEV.md` en `cloud-project-infra` para el stack completo.
