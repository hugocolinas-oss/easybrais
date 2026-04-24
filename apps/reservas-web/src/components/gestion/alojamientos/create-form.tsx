"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createAccommodation } from "@/app/gestion/(dashboard)/alojamientos/actions";

interface Props {
  stages: string[];
  towns: string[];
  existingCodes?: string[];
  stageNumberMap?: Record<string, number>;
}

function suggestNextCode(stageName: string, existingCodes: string[], stageNumberMap: Record<string, number>): string {
  const stageNum = stageNumberMap[stageName];
  if (stageNum == null || Number.isNaN(stageNum)) return "";

  const codesInStage = existingCodes
    .filter((c) => {
      const n = parseInt(c.split(".")[0], 10);
      return n === stageNum;
    })
    .map((c) => {
      const seq = parseInt(c.split(".")[1] ?? "0", 10);
      return Number.isNaN(seq) ? 0 : seq;
    });

  const maxSeq = codesInStage.length > 0 ? Math.max(...codesInStage) : 0;
  const next = maxSeq + 1;
  return `${stageNum}.${next < 10 ? "0" : ""}${next}`;
}

export function CreateAccommodationForm({ stages, towns, existingCodes = [], stageNumberMap = {} }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [externalCode, setExternalCode] = useState("");
  const [stageName, setStageName] = useState("");
  const [town, setTown] = useState("");
  const [routeName, setRouteName] = useState("");
  const [address, setAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [active, setActive] = useState(true);
  const [visible, setVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [internalNotes, setInternalNotes] = useState("");
  const [reservationNotes, setReservationNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [stageSearch, setStageSearch] = useState("");
  const [townSearch, setTownSearch] = useState("");
  const [showStages, setShowStages] = useState(false);
  const [showTowns, setShowTowns] = useState(false);

  const filteredStages = useMemo(
    () => stages.filter((s) => s.toLowerCase().includes(stageSearch.toLowerCase())),
    [stages, stageSearch],
  );
  const filteredTowns = useMemo(
    () => towns.filter((t) => t.toLowerCase().includes(townSearch.toLowerCase())),
    [towns, townSearch],
  );

  const handleStageSelect = useCallback((s: string) => {
    setStageName(s);
    setStageSearch(s);
    setShowStages(false);
    const suggested = suggestNextCode(s, existingCodes, stageNumberMap);
    if (suggested) setExternalCode(suggested);
  }, [existingCodes, stageNumberMap]);

  const handleTownSelect = useCallback((t: string) => {
    setTown(t);
    setTownSearch(t);
    setShowTowns(false);
  }, []);

  function handleSubmit(action: "list" | "continue") {
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    startTransition(async () => {
      const res = await createAccommodation({
        name: name.trim(),
        display_name: displayName.trim() || name.trim(),
        external_code: externalCode || undefined,
        stage_name: stageName || undefined,
        town: town || undefined,
        route_name: routeName || undefined,
        address: address || undefined,
        contact_phone: contactPhone || undefined,
        contact_email: contactEmail || undefined,
        active,
        visible_in_reservations: visible,
        sort_order: sortOrder,
        internal_notes: internalNotes || undefined,
        reservation_notes: reservationNotes || undefined,
      });

      if ("error" in res) {
        setError(res.error);
        return;
      }

      if (action === "list") {
        router.push("/gestion/alojamientos");
      } else {
        setSuccess(`Alojamiento "${name.trim()}" creado correctamente.`);
        setName("");
        setDisplayName("");
        setExternalCode("");
        setAddress("");
        setContactPhone("");
        setContactEmail("");
        setInternalNotes("");
        setReservationNotes("");
        setSortOrder(0);
      }
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {success}
        </div>
      )}

      <Section title="Identificación">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre interno *" hint="Nombre único en el sistema">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Hotel Parador de Tui" maxLength={200} className={inputClass} />
          </Field>
          <Field label="Nombre público" hint="Lo que ve el cliente (si es distinto)">
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={name || "Se usará el nombre interno"} maxLength={200} className={inputClass} />
          </Field>
          <Field label="Código externo" hint="Se asigna automáticamente al elegir etapa">
            <input type="text" value={externalCode} onChange={(e) => setExternalCode(e.target.value)} placeholder="Selecciona una etapa primero" maxLength={20} className={`${inputClass} bg-gray-50`} readOnly={false} />
          </Field>
          <Field label="Orden" hint="Menor = aparece antes">
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} min={0} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Ubicación">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Etapa">
            <div className="relative">
              <input
                type="text"
                value={showStages ? stageSearch : stageName}
                onChange={(e) => { setStageSearch(e.target.value); setStageName(e.target.value); setShowStages(true); }}
                onFocus={() => { setStageSearch(stageName); setShowStages(true); }}
                onBlur={() => setTimeout(() => setShowStages(false), 300)}
                placeholder="Buscar etapa..."
                className={inputClass}
              />
              {showStages && filteredStages.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {filteredStages.map((s) => (
                    <li key={s}>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); handleStageSelect(s); }} className="w-full px-3 py-2 text-left text-sm hover:bg-brand-50">
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Field>
          <Field label="Localidad">
            <div className="relative">
              <input
                type="text"
                value={showTowns ? townSearch : town}
                onChange={(e) => { setTownSearch(e.target.value); setTown(e.target.value); setShowTowns(true); }}
                onFocus={() => { setTownSearch(town); setShowTowns(true); }}
                onBlur={() => setTimeout(() => setShowTowns(false), 300)}
                placeholder="Buscar localidad..."
                className={inputClass}
              />
              {showTowns && filteredTowns.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {filteredTowns.map((t) => (
                    <li key={t}>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); handleTownSelect(t); }} className="w-full px-3 py-2 text-left text-sm hover:bg-brand-50">
                        {t}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Field>
          <Field label="Ruta">
            <input type="text" value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="Ej: Camino Portugués" maxLength={100} className={inputClass} />
          </Field>
          <Field label="Dirección">
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección completa" maxLength={300} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Contacto">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teléfono">
            <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+34 600 000 000" maxLength={30} className={inputClass} />
          </Field>
          <Field label="Email">
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="contacto@alojamiento.es" maxLength={254} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Visibilidad y estado">
        <div className="flex flex-wrap gap-6">
          <Toggle label="Activo" hint="Disponible en el sistema" checked={active} onChange={setActive} />
          <Toggle label="Visible en reservas" hint="Aparece en el formulario público" checked={visible} onChange={setVisible} />
        </div>
      </Section>

      <Section title="Notas">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Notas internas" hint="Solo visible para staff">
            <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={3} maxLength={1000} placeholder="Notas de gestión..." className={inputClass} />
          </Field>
          <Field label="Notas de reserva" hint="Visible para el cliente">
            <textarea value={reservationNotes} onChange={(e) => setReservationNotes(e.target.value)} rows={3} maxLength={500} placeholder="Info para el cliente..." className={inputClass} />
          </Field>
        </div>
      </Section>

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => router.push("/gestion/alojamientos")} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">
          Cancelar
        </button>
        <button type="button" disabled={pending} onClick={() => handleSubmit("continue")} className="rounded-lg border border-brand-700 px-4 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-50">
          {pending ? "Guardando..." : "Guardar y crear otro"}
        </button>
        <button type="button" disabled={pending} onClick={() => handleSubmit("list")} className="rounded-lg bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50">
          {pending ? "Guardando..." : "Guardar y volver"}
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 disabled:bg-gray-50";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
      <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-700">
        {label}
        {hint && <span className="ml-1 font-normal text-gray-400">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${checked ? "bg-brand-700" : "bg-gray-200"}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-[11px] text-gray-400">{hint}</p>
      </div>
    </label>
  );
}
