export interface PhoneCountry {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "ES", name: "España", flag: "🇪🇸", dialCode: "+34" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", dialCode: "+351" },
  { code: "FR", name: "Francia", flag: "🇫🇷", dialCode: "+33" },
  { code: "DE", name: "Alemania", flag: "🇩🇪", dialCode: "+49" },
  { code: "IT", name: "Italia", flag: "🇮🇹", dialCode: "+39" },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧", dialCode: "+44" },
  { code: "IE", name: "Irlanda", flag: "🇮🇪", dialCode: "+353" },
  { code: "NL", name: "Países Bajos", flag: "🇳🇱", dialCode: "+31" },
  { code: "BE", name: "Bélgica", flag: "🇧🇪", dialCode: "+32" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", dialCode: "+1" },
  { code: "CA", name: "Canadá", flag: "🇨🇦", dialCode: "+1" },
  { code: "MX", name: "México", flag: "🇲🇽", dialCode: "+52" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", dialCode: "+55" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", dialCode: "+54" },
  { code: "JP", name: "Japón", flag: "🇯🇵", dialCode: "+81" },
  { code: "CN", name: "China", flag: "🇨🇳", dialCode: "+86" },
  { code: "KR", name: "Corea del Sur", flag: "🇰🇷", dialCode: "+82" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "SG", name: "Singapur", flag: "🇸🇬", dialCode: "+65" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", dialCode: "+852" },
  { code: "TW", name: "Taiwán", flag: "🇹🇼", dialCode: "+886" },
  { code: "TH", name: "Tailandia", flag: "🇹🇭", dialCode: "+66" },
  { code: "MY", name: "Malasia", flag: "🇲🇾", dialCode: "+60" },
  { code: "PH", name: "Filipinas", flag: "🇵🇭", dialCode: "+63" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { code: "NZ", name: "Nueva Zelanda", flag: "🇳🇿", dialCode: "+64" },
];

const DEFAULT_COUNTRY_CODE = "ES";

function getCountryByCode(code: string): PhoneCountry {
  return PHONE_COUNTRIES.find((country) => country.code === code) ?? PHONE_COUNTRIES[0]!;
}

function sanitizeRawPhone(value: string): string {
  return value.replace(/[^\d+\s\-()./]/g, "").trim();
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function splitPhoneNumber(value: string): { country: PhoneCountry; nationalNumber: string; hasExplicitPrefix: boolean } {
  const raw = compactWhitespace(sanitizeRawPhone(value));
  if (!raw.startsWith("+")) {
    return {
      country: getCountryByCode(DEFAULT_COUNTRY_CODE),
      nationalNumber: raw,
      hasExplicitPrefix: false,
    };
  }

  const match = [...PHONE_COUNTRIES]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => raw.startsWith(country.dialCode));

  if (!match) {
    return {
      country: getCountryByCode(DEFAULT_COUNTRY_CODE),
      nationalNumber: raw.replace(/^\+/, "").trim(),
      hasExplicitPrefix: true,
    };
  }

  return {
    country: match,
    nationalNumber: raw.slice(match.dialCode.length).trim(),
    hasExplicitPrefix: true,
  };
}

export function normalizePhoneValue(value: string, countryCode = DEFAULT_COUNTRY_CODE): string {
  const raw = compactWhitespace(sanitizeRawPhone(value));
  if (!raw) return "";

  if (raw.startsWith("+")) {
    const digits = digitsOnly(raw);
    return digits ? `+${digits}` : "";
  }

  const digits = digitsOnly(raw);
  if (!digits) return "";

  return `${getCountryByCode(countryCode).dialCode}${digits}`;
}

export function formatPhoneForDisplay(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = compactWhitespace(sanitizeRawPhone(value));
  if (!raw) return null;

  if (!raw.startsWith("+")) {
    return raw;
  }

  const { country, nationalNumber, hasExplicitPrefix } = splitPhoneNumber(raw);
  if (!hasExplicitPrefix) {
    return raw;
  }

  return nationalNumber ? `${country.dialCode} ${nationalNumber}` : country.dialCode;
}

export function formatPhoneHref(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = normalizePhoneValue(value);
  if (normalized) return normalized;

  const raw = compactWhitespace(sanitizeRawPhone(value));
  return raw || null;
}

export function buildWhatsAppHref(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = digitsOnly(value);
  return digits.length >= 6 ? `https://wa.me/${digits}` : null;
}
