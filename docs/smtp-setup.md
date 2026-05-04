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
