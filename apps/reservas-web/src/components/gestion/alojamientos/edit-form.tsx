"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updateAccommodation } from "@/app/gestion/(dashboard)/alojamientos/actions";
import type { AccommodationRow } from "@/lib/gestion/accommodation-queries";

interface Props {
  accommodation: AccommodationRow;
}

export function EditAccommodationForm({ accommodation: a }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const fd = new FormData(e.currentTarget);
    const rawLat = (fd.get("lat") as string)?.trim();
    const rawLng = (fd.get("lng") as string)?.trim();
    const rawExtraCost = (fd.get("extra_cost") as string)?.trim();

    const fields = {
      name: (fd.get("name") as string)?.trim() || a.name,
      display_name: (fd.get("display_name") as string)?.trim() || a.name,
      external_code: (fd.get("external_code") as string)?.trim() || null,
      stage_name: (fd.get("stage_name") as string)?.trim() || null,
      town: (fd.get("town") as string)?.trim() || null,
      route_name: (fd.get("route_name") as string)?.trim() || null,
      active: fd.get("active") === "on",
      visible_in_reservations: fd.get("visible_in_reservations") === "on",
      internal_notes: (fd.get("internal_notes") as string) || null,
      reservation_notes: (fd.get("reservation_notes") as string) || null,
      sort_order: parseInt(fd.get("sort_order") as string, 10) || 0,
      contact_phone: (fd.get("contact_phone") as string) || null,
      contact_email: (fd.get("contact_email") as string) || null,
      address: (fd.get("address") as string) || null,
      lat: rawLat ? Number(rawLat) : null,
      lng: rawLng ? Number(rawLng) : null,
      extra_cost: rawExtraCost ? Number(rawExtraCost) : 0,
    };

    startTransition(async () => {
      const result = await updateAccommodation(a.id, fields);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Alojamiento actualizado correctamente.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Nombre interno">
          <input
            type="text"
            name="name"
            defaultValue={a.name}
            maxLength={200}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </Field>

        <Field label="Código externo">
          <input
            type="text"
            name="external_code"
            defaultValue={a.external_code ?? ""}
            placeholder="Ej: 7.01"
            maxLength={20}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </Field>

        <Field label="Nombre público (display_name)">
          <input
            type="text"
            name="display_name"
            defaultValue={a.display_name ?? a.name}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </Field>

        <Field label="Etapa">
          <input
            type="text"
            name="stage_name"
            defaultValue={a.stage_name ?? ""}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </Field>

        <Field label="Localidad">
          <input
            type="text"
            name="town"
            defaultValue={a.town ?? ""}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </Field>

        <Field label="Ruta">
          <input
            type="text"
            name="route_name"
            defaultValue={a.route_name ?? ""}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </Field>

        <Field label="Dirección">
          <input
            type="text"
            name="address"
            defaultValue={a.address ?? ""}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </Field>

        <Field label="Latitud">
          <input
            type="number"
            step="any"
            name="lat"
            defaultValue={a.lat ?? ""}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </Field>

        <Field label="Longitud">
          <input
            type="number"
            step="any"
            name="lng"
            defaultValue={a.lng ?? ""}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </Field>

        <Field label="Teléfono de contacto">
          <input
            type="text"
            name="contact_phone"
            defaultValue={a.contact_phone ?? ""}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </Field>

        <Field label="Email de contacto">
          <input
            type="email"
            name="contact_email"
            defaultValue={a.contact_email ?? ""}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </Field>

        <Field label="Orden de visualización">
          <input
            type="number"
            name="sort_order"
            defaultValue={a.sort_order}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </Field>

        <Field label="Extra por desplazamiento (€)">
          <input
            type="number"
            name="extra_cost"
            min={0}
            step="0.01"
            defaultValue={a.internal_cost?.extra_cost ?? 0}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
          <p className="mt-1 text-[11px] text-gray-400">Solo visible para el equipo.</p>
        </Field>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={a.active} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600" />
          <span>Activo</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="visible_in_reservations" defaultChecked={a.visible_in_reservations} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600" />
          <span>Visible en reservas públicas</span>
        </label>
      </div>

      {/* Text areas */}
      <Field label="Notas para el cliente">
        <textarea
          name="reservation_notes"
          rows={2}
          defaultValue={a.reservation_notes ?? ""}
          placeholder="Se mostrarán junto al nombre en el formulario de reservas"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
        />
      </Field>

      <Field label="Notas internas (solo staff)">
        <textarea
          name="internal_notes"
          rows={3}
          defaultValue={a.internal_notes ?? ""}
          placeholder="Solo visible para el equipo de gestión"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Volver
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}
