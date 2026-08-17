"use client";

import { useState, useTransition } from "react";
import { updateBookingCustomer } from "@/app/gestion/(dashboard)/reservas/actions";
import { formatPhoneForDisplay, formatPhoneHref } from "@/lib/phone";

interface CustomerValue {
  fullName: string;
  email: string;
  phone: string;
  language: string;
  notes: string;
}

interface Props extends CustomerValue {
  bookingId: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  es: "Español",
  en: "Inglés",
  pt: "Portugués",
  fr: "Francés",
  de: "Alemán",
  it: "Italiano",
};

const INPUT_CLASS = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export function CustomerEditor({ bookingId, ...initial }: Props) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<CustomerValue>(initial);
  const [value, setValue] = useState<CustomerValue>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CustomerValue>(field: K, next: CustomerValue[K]) {
    setValue((current) => ({ ...current, [field]: next }));
  }

  function cancel() {
    setValue(saved);
    setError(null);
    setEditing(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateBookingCustomer(bookingId, value);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSaved(value);
      setEditing(false);
    });
  }

  if (!editing) {
    const phoneDisplay = formatPhoneForDisplay(saved.phone);
    const phoneHref = formatPhoneHref(saved.phone);

    return (
      <div>
        <div className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <ViewField label="Nombre" value={saved.fullName} />
          <ViewField label="Idioma" value={LANGUAGE_LABELS[saved.language] ?? saved.language.toUpperCase()} />
          <div>
            <span className="text-xs text-gray-400">Email</span>
            <p><a href={`mailto:${saved.email}`} className="text-brand-700 hover:underline">{saved.email}</a></p>
          </div>
          <div>
            <span className="text-xs text-gray-400">Teléfono</span>
            <p>{phoneDisplay && phoneHref ? <a href={`tel:${phoneHref}`} className="text-brand-700 hover:underline">{phoneDisplay}</a> : "—"}</p>
          </div>
        </div>
        {saved.notes && (
          <div className="mt-3 rounded-md bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-700">Observaciones del cliente</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-amber-900">{saved.notes}</p>
          </div>
        )}
        <button type="button" onClick={() => setEditing(true)} className="mt-3 text-xs font-semibold text-brand-700 hover:underline">
          Editar datos personales
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <EditField label="Nombre">
          <input value={value.fullName} onChange={(e) => update("fullName", e.target.value)} maxLength={120} disabled={pending} className={INPUT_CLASS} />
        </EditField>
        <EditField label="Idioma">
          <select value={value.language} onChange={(e) => update("language", e.target.value)} disabled={pending} className={INPUT_CLASS}>
            {Object.entries(LANGUAGE_LABELS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </EditField>
        <EditField label="Email">
          <input type="email" value={value.email} onChange={(e) => update("email", e.target.value)} maxLength={254} disabled={pending} className={INPUT_CLASS} />
        </EditField>
        <EditField label="Teléfono">
          <input type="tel" value={value.phone} onChange={(e) => update("phone", e.target.value)} maxLength={30} disabled={pending} className={INPUT_CLASS} />
        </EditField>
      </div>
      <EditField label="Observaciones del cliente">
        <textarea value={value.notes} onChange={(e) => update("notes", e.target.value)} rows={3} maxLength={500} disabled={pending} className={INPUT_CLASS} />
      </EditField>
      <div className="flex items-center gap-2">
        <button type="button" onClick={save} disabled={pending} className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        <button type="button" onClick={cancel} disabled={pending} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}

function ViewField({ label, value }: { label: string; value: string }) {
  return <div><span className="text-xs text-gray-400">{label}</span><p className="text-sm text-gray-900">{value || "—"}</p></div>;
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>{children}</label>;
}
