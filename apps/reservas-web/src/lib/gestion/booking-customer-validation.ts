import { isPhoneValueValid, normalizePhoneValue } from "@/lib/phone";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const CUSTOMER_LANGUAGES = new Set(["es", "en", "pt", "fr", "de", "it"]);

export interface BookingCustomerFields {
  fullName: string;
  email: string;
  phone: string;
  language: string;
  notes: string;
}

type ValidationResult =
  | { data: BookingCustomerFields; error?: never }
  | { data?: never; error: string };

export function validateBookingCustomerUpdate(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") return { error: "Datos personales inválidos." };

  const fields = input as Partial<BookingCustomerFields>;
  if (
    typeof fields.fullName !== "string"
    || typeof fields.email !== "string"
    || typeof fields.phone !== "string"
    || typeof fields.language !== "string"
    || typeof fields.notes !== "string"
  ) return { error: "Datos personales inválidos." };

  const fullName = fields.fullName.trim();
  const email = fields.email.trim().toLowerCase();
  const phone = normalizePhoneValue(fields.phone);
  const language = fields.language.trim().toLowerCase();
  const notes = fields.notes.trim();

  if (!fullName) return { error: "El nombre es obligatorio." };
  if (fullName.length > 120) return { error: "El nombre es demasiado largo." };
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return { error: "El email no es válido." };
  if (!phone || phone.length > 30 || !isPhoneValueValid(phone)) return { error: "El teléfono no es válido." };
  if (!CUSTOMER_LANGUAGES.has(language)) return { error: "El idioma no es válido." };
  if (notes.length > 500) return { error: "Las observaciones son demasiado largas." };

  return { data: { fullName, email, phone, language, notes } };
}
