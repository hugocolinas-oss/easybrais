# Easy Brais — Monorepo

Plataforma SaaS de reservas y gestión para Easy Brais.

## Requisitos previos

- **Node.js** >= 20
- **pnpm** >= 9 (`npm install -g pnpm`)

## Arranque local

```bash
# 1. Instalar dependencias
pnpm install

# 2. Copiar variables de entorno
cp .env.example .env.local
cp apps/reservas-web/.env.local.example apps/reservas-web/.env.local
cp apps/gestion-web/.env.local.example apps/gestion-web/.env.local

# 3. Editar los .env.local con tus credenciales de Supabase

# 4. Arrancar ambas apps en desarrollo
pnpm dev
```

## Scripts disponibles

| Comando               | Descripción                              |
|-----------------------|------------------------------------------|
| `pnpm dev`            | Arranca ambas apps en paralelo           |
| `pnpm dev:reservas`   | Solo app de reservas (puerto 3000)       |
| `pnpm dev:gestion`    | Solo panel de gestión (puerto 3001)      |
| `pnpm build`          | Build de producción de todo              |
| `pnpm build:reservas` | Build solo de la app de reservas         |
| `pnpm build:gestion`  | Build solo del panel de gestión          |
| `pnpm lint`           | Lint de todo el monorepo                 |
| `pnpm type-check`     | Verificación de tipos                    |
| `pnpm clean`          | Limpia builds y node_modules             |

## Estructura

```
apps/
  reservas-web/     → App pública de reservas (localhost:3000)
  gestion-web/      → Panel de gestión (localhost:3001)
packages/
  ui/               → Componentes React compartidos
  types/            → Tipos TypeScript compartidos
  utils/            → Utilidades y cliente Supabase
supabase/
  migrations/       → Migraciones SQL
  seed/             → Datos de prueba
docs/               → Documentación
```

## Despliegue

Preparado para Vercel. Cada app se despliega como proyecto independiente apuntando a su directorio dentro del monorepo.
