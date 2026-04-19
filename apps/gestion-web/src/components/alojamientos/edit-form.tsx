"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updateAccommodation } from "@/app/(dashboard)/alojamientos/actions";
import type { AccommodationRow } from "@/lib/accommodation-queries";

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

    const fields = {
      display_name: (fd.get("display_name") as string) || a.name,
      active: fd.get("active") === "on",
      visible_in_reservations: fd.get("visible_in_reservations") === "on",
      internal_notes: (fd.get("internal_notes") as string) || null,
      reservation_notes: (fd.get("reservation_notes") as string) || null,
      sort_order: parseInt(fd.get("sort_order") as string, 10) || 0,
      contact_phone: (fd.get("contact_phone") as string) || null,
      contact_email: (fd.get("contact_email") as string) || null,
      address: (fd.get("address") as string) || null,
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
        {/* Read-only info */}
        <Field label="Nombre original (no editable)">
          <input type="text" value={a.name} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
        </Field>

        <Field label="Código externo">
          <input type="text" value={a.external_code ?? "—"} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
        </Field>

        {/* Editable fields */}
        <Field label="Nombre público (display_name)">
          <input
            type="text"
            name="display_name"
            defaultValue={a.display_name ?? a.name}
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

        <Field label="Etapa">
          <input type="text" value={a.stage_name ?? "—"} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
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
      <Field label="Notas para el cliente (reservation_notes)">
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
