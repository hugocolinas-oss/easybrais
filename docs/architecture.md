# Arquitectura — Easy Brais

## Estructura del monorepo

```
/
├── apps/
│   ├── reservas-web/    → App pública de reservas (Next.js, puerto 3000)
│   └── gestion-web/     → Panel de gestión (Next.js, puerto 3001)
├── packages/
│   ├── ui/              → Componentes React compartidos
│   ├── types/           → Tipos TypeScript compartidos
│   └── utils/           → Utilidades y cliente Supabase
├── supabase/
│   ├── migrations/      → Migraciones SQL
│   └── seed/            → Datos de prueba
└── docs/                → Documentación del proyecto
```

## Stack técnico

| Capa       | Tecnología        |
|------------|-------------------|
| Frontend   | Next.js 15, React 19, Tailwind CSS 3 |
| Backend    | Supabase (Auth, DB, Storage) |
| Monorepo   | pnpm workspaces + Turborepo |
| Deploy     | Vercel (una app por proyecto) |
| Lenguaje   | TypeScript strict |

## Convenciones

- **Rutas públicas**: `app.easybrais.es/reservas` → `reservas-web`
- **Rutas de gestión**: `app.easybrais.es/gestion` → `gestion-web`
- Los packages internos usan el scope `@easybrais/`
- Las variables de entorno compartidas van en `.env.example` (raíz)
- Cada app tiene su propio `.env.local.example`

## Despliegue

Cada app se despliega como un proyecto independiente en Vercel, apuntando al directorio correspondiente dentro del monorepo.
