import type { BookingEventRow } from "@/lib/booking-queries";
import { getStatusConfig } from "@/lib/booking-status";

const EVENT_LABELS: Record<string, { label: string; dot: string }> = {
  created: { label: "Reserva creada", dot: "bg-green-400" },
  updated: { label: "Reserva actualizada", dot: "bg-gray-400" },
  status_changed: { label: "Cambio de estado", dot: "bg-blue-400" },
  item_status_changed: { label: "Estado de tramo actualizado", dot: "bg-indigo-400" },
  incident_reported: { label: "Incidencia reportada", dot: "bg-red-400" },
  payment_received: { label: "Pago recibido", dot: "bg-green-500" },
  email_sent: { label: "Email enviado", dot: "bg-sky-400" },
  note_added: { label: "Nota añadida", dot: "bg-amber-400" },
  cancelled: { label: "Reserva cancelada", dot: "bg-red-500" },
};

const ACTOR_LABELS: Record<string, string> = {
  system: "Sistema",
  staff: "Staff",
  customer: "Cliente",
};

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EventTimeline({ events }: { events: BookingEventRow[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-400">Sin eventos registrados.</p>;
  }

  return (
    <div className="space-y-0">
      {events.map((ev, i) => {
        const payload = ev.payload_json;
        const cfg = EVENT_LABELS[ev.event_type] ?? { label: ev.event_type, dot: "bg-gray-300" };
        let detail = "";

        if (ev.event_type === "status_changed" && payload) {
          const from = getStatusConfig(String(payload.from ?? "")).shortLabel;
          const to = getStatusConfig(String(payload.to ?? "")).shortLabel;
          detail = `${from} → ${to}`;
          if (payload.reason) detail += ` (${payload.reason})`;
        } else if (ev.event_type === "item_status_changed" && payload) {
          const from = String(payload.from ?? "—");
          const to = String(payload.to ?? "—");
          detail = `${from} → ${to}`;
        } else if (ev.event_type === "incident_reported" && payload) {
          detail = String(payload.message ?? "Sin detalle");
        } else if (ev.event_type === "email_sent" && payload) {
          detail = payload.sent
            ? `Enviado a ${payload.recipient ?? "—"}`
            : `Fallo: ${payload.error ?? "desconocido"}`;
        } else if (ev.event_type === "note_added") {
          detail = "Notas internas editadas";
        } else if (ev.event_type === "created" && payload) {
          const parts: string[] = [];
          if (payload.source) parts.push(`Fuente: ${payload.source}`);
          if (payload.legs_count) parts.push(`${payload.legs_count} tramo(s)`);
          if (payload.total_bags) parts.push(`${payload.total_bags} mochilas`);
          if (payload.total) parts.push(`Total: ${payload.total} €`);
          detail = parts.join(" · ");
        } else if (ev.event_type === "cancelled" && payload) {
          detail = String(payload.reason ?? "");
        }

        return (
          <div key={ev.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
              {i < events.length - 1 && <div className="w-px flex-1 bg-gray-200" />}
            </div>

            <div className="pb-4">
              <p className="text-sm font-medium text-gray-800">
                {cfg.label}
              </p>
              {detail && <p className="text-xs text-gray-500">{detail}</p>}
              <p className="mt-0.5 text-[11px] text-gray-400">
                {fmtTime(ev.created_at)} · {ACTOR_LABELS[ev.actor_type] ?? ev.actor_type}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
