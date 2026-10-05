# cloud-project-frontend

UI mínima del servicio de finanzas (TypeScript + Next.js + `bun`). Consume al
backend **solo por REST server-side** (`lib/api.ts` + route handlers; nada de
gRPC en el navegador).

## Layout

- `app/` — páginas y route handlers (`api/balance/route.ts`)
- `components/` — `MovementForm`, `MovementList`, `Balance` (UI mínima)
- `lib/api.ts` — cliente REST server-side
- `contracts.version` — tag BE fijado (p. ej. `contracts/v1.0.0`)
- `vendor/openapi.yaml` — copia byte-idéntica del tag fijado (FR-006);
  actualizarla al subir de versión y cambia en el mismo PR
- `k8s/` — `deployment.yaml`, `service.yaml`, `endpoints.yaml` (hacia el
  NodePort del backend)
- `.github/workflows/deploy.yaml` — check de vendorizado + buildx → push ECR
  (`:sha`, `:semver`) → `kubectl apply` → smoke + health check cruzado del
  backend con reversión (puerta SC-007)

## Uso local

```bash
bun install --frozen-lockfile && bun run build
docker build -t frontend:local .
```

Ver `docs/LOCAL_DEV.md` en `cloud-project-infra` para el stack completo.
