# Integración con Supabase

## Configuración inicial

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com/dashboard](https://supabase.com/dashboard) y crea un nuevo proyecto.
2. Anota la **URL del proyecto** y las **claves API** (Settings → API).

### 2. Variables de entorno

```bash
# Desde la raíz del monorepo
cp .env.example .env.local
cp apps/reservas-web/.env.local.example apps/reservas-web/.env.local
cp apps/gestion-web/.env.local.example apps/gestion-web/.env.local
```

Rellena cada `.env.local` con los valores de tu proyecto Supabase:

| Variable                        | Dónde encontrarla             | Visible en cliente |
|---------------------------------|-------------------------------|--------------------|
| `NEXT_PUBLIC_SUPABASE_URL`      | Settings → API → Project URL  | Sí                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → anon key     | Sí                 |
| `SUPABASE_SERVICE_ROLE_KEY`     | Settings → API → service_role | **No** (solo server) |

### 3. Habilitar Auth (opcional)

En el dashboard de Supabase → Authentication → Providers, habilita los métodos que necesites (email/password viene activo por defecto).

---

## Arquitectura de clientes

```
packages/utils/src/supabase/
├── config.ts       → Validación de env vars
├── client.ts       → Browser client (singleton, @supabase/ssr)
├── server.ts       → Server client factory (recibe cookies)
├── admin.ts        → Admin client (service_role, sin RLS)
├── middleware.ts    → Client para middleware (refresca sesión)
├── types.ts        → Tipos internos de cookies
└── index.ts        → Re-exports
```

### Browser Client (componentes cliente)

```tsx
"use client";
import { getClientSupabase } from "@/lib/supabase/client";

function MyComponent() {
  const supabase = getClientSupabase();
  // usar supabase...
}
```

### Server Client (Server Components, Server Actions, Route Handlers)

```ts
import { getServerSupabase } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await getServerSupabase();
  const { data } = await supabase.from("tabla").select("*");
  // ...
}
```

### Admin Client (operaciones privilegiadas server-side)

```ts
import { createAdminClient } from "@easybrais/utils/supabase/admin";

async function adminOperation() {
  const supabase = createAdminClient();
  // Bypassa RLS — solo usar en contextos de confianza
}
```

---

## Auth helpers

```ts
import { signIn, signUp, signOut, getUser } from "@easybrais/utils/auth";

// Todos reciben el client de Supabase como primer argumento
const result = await signIn(supabase, { email, password });

if (result.error) {
  console.error(result.error.message);
} else {
  console.log(result.data); // AuthUser
}
```

---

## Middleware

Ambas apps incluyen `src/middleware.ts` que:

- **reservas-web**: Refresca la sesión en cada request (sin protección de rutas).
- **gestion-web**: Refresca la sesión + redirige a `/login` si no hay usuario autenticado.

---

## Tipos de base de datos

El archivo `packages/types/src/database.ts` es un placeholder. Cuando tengas tablas creadas:

```bash
npx supabase gen types typescript --project-id <tu-project-id> > packages/types/src/database.ts
```

Esto genera tipos completos para todas las tablas, vistas y funciones.

---

## Flujo de auth completo

```
Browser → Middleware (refresca cookies) → Server Component (lee sesión)
   ↓                                           ↓
Client Component ←── auth state ────── Supabase Auth
```

1. El **middleware** refresca tokens en cada request.
2. Los **Server Components** leen la sesión vía `getServerSupabase()`.
3. Los **Client Components** usan `getClientSupabase()` con cookies automáticas.
4. Las rutas `/auth/callback` manejan OAuth y magic links.
