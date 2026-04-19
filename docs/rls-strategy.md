# Estrategia RLS — Easy Brais Beta

## Principio general

**Todo cerrado por defecto.** RLS está activado en las 7 tablas. Si no hay una política explícita que lo permita, el acceso es denegado.

## Roles de acceso

| Rol Supabase | Quién lo usa | Cómo llega |
|-------------|-------------|------------|
| `anon` | App pública (reservas-web) | API key pública |
| `authenticated` | Staff (gestion-web) | Login con email/password |
| `service_role` | Server-side (API routes, scripts) | Key secreta, bypassa RLS |

## Función helper

```sql
current_user_role() → staff_role | NULL
```

Devuelve el rol del usuario autenticado si tiene un perfil activo. Se usa en todas las políticas para verificar permisos sin repetir la query.

## Matriz de permisos

| Tabla | `anon` | `operator` | `manager` | `admin` |
|-------|--------|------------|-----------|---------|
| **accommodations** | SELECT (active) | SELECT | SELECT + INSERT + UPDATE | SELECT + INSERT + UPDATE |
| **customers** | — | SELECT + INSERT + UPDATE | SELECT + INSERT + UPDATE | SELECT + INSERT + UPDATE |
| **bookings** | — | SELECT + INSERT + UPDATE | SELECT + INSERT + UPDATE | SELECT + INSERT + UPDATE |
| **booking_items** | — | SELECT + INSERT + UPDATE | SELECT + INSERT + UPDATE | SELECT + INSERT + UPDATE |
| **booking_events** | — | SELECT + INSERT | SELECT + INSERT | SELECT + INSERT |
| **daily_cash_closures** | — | — | SELECT + INSERT + UPDATE | SELECT + INSERT + UPDATE |
| **user_profiles** | — | SELECT (propio) | SELECT (propio) | SELECT ALL + INSERT + UPDATE |

## Decisiones clave

1. **`anon` solo lee alojamientos activos** — es lo único que necesita la app pública para mostrar opciones de recogida/entrega.

2. **Las reservas públicas NO se crean con `anon`** — se crearán vía `service_role` desde server-side (API routes en reservas-web). Esto evita que cualquiera inserte datos directamente.

3. **`booking_events` es inmutable** — no hay políticas de UPDATE ni DELETE. Es un log de auditoría.

4. **`daily_cash_closures` es solo para manager/admin** — datos financieros protegidos.

5. **Perfiles: cada usuario lee el suyo; solo admin gestiona** — previene escalada de privilegios.

6. **No hay DELETE en ninguna tabla** — para la beta, los borrados se gestionan con flags (`active`, `status: cancelled`). Los DELETE físicos se hacen vía `service_role` si es necesario.

## Cómo se aplica en las apps

```
reservas-web (público)
  ├── Browser: anon key → solo lee accommodations activos
  └── Server (API routes): service_role → crea bookings de forma controlada

gestion-web (staff)
  ├── Browser: authenticated → permisos según rol del perfil
  └── Server (actions): authenticated → mismos permisos (cookies de sesión)
```
