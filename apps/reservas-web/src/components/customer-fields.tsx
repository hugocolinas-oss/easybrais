"use client";

import { useT } from "@/lib/i18n/context";

interface CustomerData {
  fullName: string;
  email: string;
  phone: string;
  language: string;
  notes: string;
}

interface Props {
  value: CustomerData;
  onChange: (value: CustomerData) => void;
  errors: Record<string, string>;
}

const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "gl", label: "Galego" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
];

export function CustomerFields({ value, onChange, errors }: Props) {
  const { t } = useT();

  function update(field: keyof CustomerData, v: string) {
    onChange({ ...value, [field]: v });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="customer-fullName"
          label={t("customer.name")}
          required
          error={errors.fullName}
        >
          <input
            id="customer-fullName"
            type="text"
            value={value.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder={t("customer.name.placeholder")}
            maxLength={120}
            className={inputClass(errors.fullName)}
          />
        </Field>

        <Field id="customer-email" label={t("customer.email")} required error={errors.email}>
          <input
            id="customer-email"
            type="email"
            value={value.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="tu@email.com"
            maxLength={254}
            className={inputClass(errors.email)}
          />
        </Field>

        <Field id="customer-phone" label={t("customer.phone")} required error={errors.phone}>
          <input
            id="customer-phone"
            type="tel"
            value={value.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+34 600 000 000"
            maxLength={30}
            className={inputClass(errors.phone)}
          />
        </Field>

        <Field id="customer-language" label={t("customer.language")}>
          <select
            id="customer-language"
            value={value.language}
            onChange={(e) => update("language", e.target.value)}
            className={inputClass()}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="customer-notes" label={t("customer.notes")}>
        <textarea
          id="customer-notes"
          value={value.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
          maxLength={500}
          placeholder={t("customer.notes.placeholder")}
          className={inputClass()}
        />
      </Field>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-brand-800/40">
        {label}
        {required && <span className="ml-0.5 text-gold-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] font-medium text-red-500">{error}</p>}
    </div>
  );
}

function inputClass(error?: string) {
  return [
    "block w-full rounded-xl border px-3 py-2.5 text-sm transition-all sm:py-3",
    "text-brand-900 placeholder:text-brand-800/25",
    "focus:outline-none focus:ring-1",
    error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "border-cream-300 focus:border-brand-700 focus:ring-brand-700",
  ].join(" ");
}
