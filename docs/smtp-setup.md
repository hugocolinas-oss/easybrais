# SMTP setup

## Variables necesarias

Servidor:

- `SMTP_HOST=smtp-relay.brevo.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=...`
- `SMTP_PASS=...`
- `SMTP_FROM_NAME=Easy Brais`
- `SMTP_FROM_EMAIL=info@easybrais.es`
- `SMTP_REPLY_TO=info@easybrais.es`
- `ADMIN_EMAIL=gestion.easybrais@gmail.com`
- `RESERVAS_URL=https://reservas.easybrais.es`

Cliente y servidor:

- `NEXT_PUBLIC_APP_URL=https://reservas.easybrais.es`
- `NEXT_PUBLIC_RESERVAS_URL=https://reservas.easybrais.es`

## .env.local

Define las variables anteriores en la raiz del proyecto. `SMTP_USER` y `SMTP_PASS` no deben llevar prefijo `NEXT_PUBLIC`.

## Vercel

Configura las mismas variables en el proyecto de Vercel para Production, Preview y Development si quieres probar desde despliegues previos.

### Checklist (evita avisos de Turbo y fallos en runtime)

Turborepo declara estas variables en `turbo.json` (`passThroughEnv` en la tarea `build`) para que no aparezcan avisos del tipo `reservas-web#build - SUPABASE_SERVICE_ROLE_KEY` y para que el build en Vercel reciba los mismos nombres que en local.

Debes crear cada clave en **Vercel → Project → Settings → Environment Variables** (marca al menos **Production**; opcional **Preview**).

| Variable | Para qué sirve |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anon (cliente) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role (solo servidor: reservas, webhooks, emails con admin client) |
| `STRIPE_SECRET_KEY` | API Stripe (checkout) |
| `STRIPE_WEBHOOK_SECRET` | Firma del webhook `checkout.session.completed` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Envío de correos (p. ej. Brevo) |
| `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`, `SMTP_REPLY_TO` | Remitente y respuesta |
| `ADMIN_EMAIL` | Destinatario del aviso de nueva reserva |
| `RESERVAS_URL` | URL absoluta en enlaces de correo (si la usa el código) |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_RESERVAS_URL` | URL pública del sitio (OAuth, enlaces) |

Si falta alguna de las de **SMTP** o **ADMIN_EMAIL**, los correos no se envían (ver logs `[reservation-email] SMTP no configurado` o errores SMTP). Si falta **Stripe**, el pago online no funciona. Si falta **Supabase service role**, fallan acciones de servidor y el webhook.

## Probar SMTP

Ejecuta:

```bash
npm run smtp:test
```

La prueba envia un email a `ADMIN_EMAIL` con asunto `Test SMTP Easy Brais`.

## Flujo integrado

- Al crear una reserva se intenta enviar un email interno a gestion y un email de confirmacion al cliente.
- La reserva se guarda aunque el envio falle.
- Los intentos se registran en `email_logs`.
- En `/gestion/reservas/[id]` existe una accion para reenviar emails manualmente.

## Si falla el envio

- Revisa que `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` y `SMTP_PASS` sean correctos.
- Revisa en Brevo si la IP o el origen estan autorizados para SMTP relay.
- Comprueba que `ADMIN_EMAIL` y `SMTP_FROM_EMAIL` existan y usen un remitente validado.
- Consulta `email_logs` y los logs del servidor para ver `error_message`.

## Vercel / produccion

- Las variables `SMTP_*` deben estar definidas en el proyecto de Vercel (no solo en `.env.local`). Si faltan, el codigo registra en logs: `SMTP no configurado` y no se envia nada.
- El envio al crear la reserva se ejecuta con **`await`** dentro de la Server Action para que la funcion serverless no termine antes de que Nodemailer acabe (las promesas en segundo plano suelen cancelarse al devolver la respuesta).
- Tras un pago con Stripe, el email de «pago recibido» se envia desde el webhook (`/api/stripe/webhook`), que ya esperaba el SMTP; si falla, busca en logs `[stripe/webhook] payment email not sent`.
