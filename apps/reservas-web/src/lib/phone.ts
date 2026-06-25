export type PhoneRegion = "Europe" | "Americas" | "Asia" | "Oceania";

export interface PhoneCountry {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  region: PhoneRegion;
}

interface PhoneCountrySeed {
  code: string;
  name: string;
  dialCode: string;
  region: PhoneRegion;
}

const DEFAULT_COUNTRY_CODE = "ES";

const SIMPLE_COUNTRY_CODES = [
  "ES",
  "PT",
  "FR",
  "DE",
  "IT",
  "GB",
  "IE",
  "NL",
  "BE",
  "US",
  "CA",
  "MX",
  "BR",
  "AR",
  "JP",
  "CN",
  "KR",
  "IN",
  "SG",
  "HK",
  "TW",
  "TH",
  "MY",
  "PH",
  "AU",
  "NZ",
] as const;

export const PHONE_PRIORITY_CODES = [
  "ES",
  "PT",
  "FR",
  "DE",
  "IT",
  "GB",
  "IE",
  "NL",
  "BE",
  "US",
  "CA",
  "MX",
  "AR",
  "BR",
  "CL",
  "CO",
  "PE",
  "UY",
  "JP",
  "CN",
  "KR",
  "IN",
  "SG",
  "AE",
  "AU",
  "NZ",
] as const;

const PHONE_COUNTRY_SEEDS: PhoneCountrySeed[] = [
  { code: "AL", name: "Albania", dialCode: "+355", region: "Europe" },
  { code: "DE", name: "Alemania", dialCode: "+49", region: "Europe" },
  { code: "AD", name: "Andorra", dialCode: "+376", region: "Europe" },
  { code: "SA", name: "Arabia Saudí", dialCode: "+966", region: "Asia" },
  { code: "AR", name: "Argentina", dialCode: "+54", region: "Americas" },
  { code: "AM", name: "Armenia", dialCode: "+374", region: "Asia" },
  { code: "AU", name: "Australia", dialCode: "+61", region: "Oceania" },
  { code: "AT", name: "Austria", dialCode: "+43", region: "Europe" },
  { code: "AZ", name: "Azerbaiyán", dialCode: "+994", region: "Asia" },
  { code: "BD", name: "Bangladés", dialCode: "+880", region: "Asia" },
  { code: "BE", name: "Bélgica", dialCode: "+32", region: "Europe" },
  { code: "BZ", name: "Belice", dialCode: "+501", region: "Americas" },
  { code: "BO", name: "Bolivia", dialCode: "+591", region: "Americas" },
  { code: "BA", name: "Bosnia y Herzegovina", dialCode: "+387", region: "Europe" },
  { code: "BR", name: "Brasil", dialCode: "+55", region: "Americas" },
  { code: "BN", name: "Brunéi", dialCode: "+673", region: "Asia" },
  { code: "BG", name: "Bulgaria", dialCode: "+359", region: "Europe" },
  { code: "CA", name: "Canadá", dialCode: "+1", region: "Americas" },
  { code: "CL", name: "Chile", dialCode: "+56", region: "Americas" },
  { code: "CN", name: "China", dialCode: "+86", region: "Asia" },
  { code: "CY", name: "Chipre", dialCode: "+357", region: "Europe" },
  { code: "CO", name: "Colombia", dialCode: "+57", region: "Americas" },
  { code: "KR", name: "Corea del Sur", dialCode: "+82", region: "Asia" },
  { code: "CR", name: "Costa Rica", dialCode: "+506", region: "Americas" },
  { code: "HR", name: "Croacia", dialCode: "+385", region: "Europe" },
  { code: "CU", name: "Cuba", dialCode: "+53", region: "Americas" },
  { code: "DK", name: "Dinamarca", dialCode: "+45", region: "Europe" },
  { code: "EC", name: "Ecuador", dialCode: "+593", region: "Americas" },
  { code: "SV", name: "El Salvador", dialCode: "+503", region: "Americas" },
  { code: "AE", name: "Emiratos Árabes Unidos", dialCode: "+971", region: "Asia" },
  { code: "SK", name: "Eslovaquia", dialCode: "+421", region: "Europe" },
  { code: "SI", name: "Eslovenia", dialCode: "+386", region: "Europe" },
  { code: "ES", name: "España", dialCode: "+34", region: "Europe" },
  { code: "US", name: "Estados Unidos", dialCode: "+1", region: "Americas" },
  { code: "EE", name: "Estonia", dialCode: "+372", region: "Europe" },
  { code: "PH", name: "Filipinas", dialCode: "+63", region: "Asia" },
  { code: "FI", name: "Finlandia", dialCode: "+358", region: "Europe" },
  { code: "FJ", name: "Fiyi", dialCode: "+679", region: "Oceania" },
  { code: "FR", name: "Francia", dialCode: "+33", region: "Europe" },
  { code: "GE", name: "Georgia", dialCode: "+995", region: "Asia" },
  { code: "GI", name: "Gibraltar", dialCode: "+350", region: "Europe" },
  { code: "GR", name: "Grecia", dialCode: "+30", region: "Europe" },
  { code: "GT", name: "Guatemala", dialCode: "+502", region: "Americas" },
  { code: "HK", name: "Hong Kong", dialCode: "+852", region: "Asia" },
  { code: "HU", name: "Hungría", dialCode: "+36", region: "Europe" },
  { code: "IN", name: "India", dialCode: "+91", region: "Asia" },
  { code: "ID", name: "Indonesia", dialCode: "+62", region: "Asia" },
  { code: "IQ", name: "Irak", dialCode: "+964", region: "Asia" },
  { code: "IR", name: "Irán", dialCode: "+98", region: "Asia" },
  { code: "IE", name: "Irlanda", dialCode: "+353", region: "Europe" },
  { code: "IS", name: "Islandia", dialCode: "+354", region: "Europe" },
  { code: "IL", name: "Israel", dialCode: "+972", region: "Asia" },
  { code: "IT", name: "Italia", dialCode: "+39", region: "Europe" },
  { code: "JM", name: "Jamaica", dialCode: "+1", region: "Americas" },
  { code: "JP", name: "Japón", dialCode: "+81", region: "Asia" },
  { code: "JO", name: "Jordania", dialCode: "+962", region: "Asia" },
  { code: "KZ", name: "Kazajistán", dialCode: "+7", region: "Asia" },
  { code: "KH", name: "Camboya", dialCode: "+855", region: "Asia" },
  { code: "KG", name: "Kirguistán", dialCode: "+996", region: "Asia" },
  { code: "KW", name: "Kuwait", dialCode: "+965", region: "Asia" },
  { code: "LA", name: "Laos", dialCode: "+856", region: "Asia" },
  { code: "LV", name: "Letonia", dialCode: "+371", region: "Europe" },
  { code: "LB", name: "Líbano", dialCode: "+961", region: "Asia" },
  { code: "LI", name: "Liechtenstein", dialCode: "+423", region: "Europe" },
  { code: "LT", name: "Lituania", dialCode: "+370", region: "Europe" },
  { code: "LU", name: "Luxemburgo", dialCode: "+352", region: "Europe" },
  { code: "MO", name: "Macao", dialCode: "+853", region: "Asia" },
  { code: "MK", name: "Macedonia del Norte", dialCode: "+389", region: "Europe" },
  { code: "MY", name: "Malasia", dialCode: "+60", region: "Asia" },
  { code: "MT", name: "Malta", dialCode: "+356", region: "Europe" },
  { code: "MD", name: "Moldavia", dialCode: "+373", region: "Europe" },
  { code: "MC", name: "Mónaco", dialCode: "+377", region: "Europe" },
  { code: "MN", name: "Mongolia", dialCode: "+976", region: "Asia" },
  { code: "ME", name: "Montenegro", dialCode: "+382", region: "Europe" },
  { code: "MM", name: "Myanmar", dialCode: "+95", region: "Asia" },
  { code: "MX", name: "México", dialCode: "+52", region: "Americas" },
  { code: "NI", name: "Nicaragua", dialCode: "+505", region: "Americas" },
  { code: "NO", name: "Noruega", dialCode: "+47", region: "Europe" },
  { code: "NZ", name: "Nueva Zelanda", dialCode: "+64", region: "Oceania" },
  { code: "OM", name: "Omán", dialCode: "+968", region: "Asia" },
  { code: "NL", name: "Países Bajos", dialCode: "+31", region: "Europe" },
  { code: "PK", name: "Pakistán", dialCode: "+92", region: "Asia" },
  { code: "PA", name: "Panamá", dialCode: "+507", region: "Americas" },
  { code: "PY", name: "Paraguay", dialCode: "+595", region: "Americas" },
  { code: "PE", name: "Perú", dialCode: "+51", region: "Americas" },
  { code: "PG", name: "Papúa Nueva Guinea", dialCode: "+675", region: "Oceania" },
  { code: "PL", name: "Polonia", dialCode: "+48", region: "Europe" },
  { code: "PT", name: "Portugal", dialCode: "+351", region: "Europe" },
  { code: "PR", name: "Puerto Rico", dialCode: "+1", region: "Americas" },
  { code: "QA", name: "Catar", dialCode: "+974", region: "Asia" },
  { code: "GB", name: "Reino Unido", dialCode: "+44", region: "Europe" },
  { code: "CZ", name: "República Checa", dialCode: "+420", region: "Europe" },
  { code: "DO", name: "República Dominicana", dialCode: "+1", region: "Americas" },
  { code: "RO", name: "Rumanía", dialCode: "+40", region: "Europe" },
  { code: "SM", name: "San Marino", dialCode: "+378", region: "Europe" },
  { code: "RS", name: "Serbia", dialCode: "+381", region: "Europe" },
  { code: "SG", name: "Singapur", dialCode: "+65", region: "Asia" },
  { code: "LK", name: "Sri Lanka", dialCode: "+94", region: "Asia" },
  { code: "SE", name: "Suecia", dialCode: "+46", region: "Europe" },
  { code: "CH", name: "Suiza", dialCode: "+41", region: "Europe" },
  { code: "TW", name: "Taiwán", dialCode: "+886", region: "Asia" },
  { code: "TH", name: "Tailandia", dialCode: "+66", region: "Asia" },
  { code: "TR", name: "Turquía", dialCode: "+90", region: "Asia" },
  { code: "UA", name: "Ucrania", dialCode: "+380", region: "Europe" },
  { code: "UY", name: "Uruguay", dialCode: "+598", region: "Americas" },
  { code: "UZ", name: "Uzbekistán", dialCode: "+998", region: "Asia" },
  { code: "VE", name: "Venezuela", dialCode: "+58", region: "Americas" },
  { code: "VN", name: "Vietnam", dialCode: "+84", region: "Asia" },
];

function flagFromCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function buildCountry(seed: PhoneCountrySeed): PhoneCountry {
  return { ...seed, flag: flagFromCode(seed.code) };
}

function compareCountries(a: PhoneCountrySeed, b: PhoneCountrySeed): number {
  if (a.region !== b.region) return a.region.localeCompare(b.region, "es");
  return a.name.localeCompare(b.name, "es");
}

export const PHONE_COUNTRIES: PhoneCountry[] = [...PHONE_COUNTRY_SEEDS].sort(compareCountries).map(buildCountry);

export const PHONE_SIMPLE_COUNTRIES = SIMPLE_COUNTRY_CODES
  .map((code) => PHONE_COUNTRIES.find((country) => country.code === code))
  .filter((country): country is PhoneCountry => Boolean(country));

export const PHONE_PRIORITY_COUNTRIES = PHONE_PRIORITY_CODES
  .map((code) => PHONE_COUNTRIES.find((country) => country.code === code))
  .filter((country): country is PhoneCountry => Boolean(country));

export const PHONE_COUNTRY_GROUPS: Array<{ region: PhoneRegion; label: string; countries: PhoneCountry[] }> = [
  { region: "Europe", label: "Europa", countries: PHONE_COUNTRIES.filter((country) => country.region === "Europe") },
  { region: "Americas", label: "América", countries: PHONE_COUNTRIES.filter((country) => country.region === "Americas") },
  { region: "Asia", label: "Asia", countries: PHONE_COUNTRIES.filter((country) => country.region === "Asia") },
  { region: "Oceania", label: "Oceanía", countries: PHONE_COUNTRIES.filter((country) => country.region === "Oceania") },
];

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

export function normalizePhoneSearch(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function splitPhoneNumber(
  value: string,
  preferredCountryCode?: string,
): { country: PhoneCountry; nationalNumber: string; hasExplicitPrefix: boolean } {
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

  const exactDialMatches = PHONE_COUNTRIES.filter((country) => country.dialCode === match.dialCode);
  const preferredCountry = preferredCountryCode
    ? exactDialMatches.find((country) => country.code === preferredCountryCode)
    : null;
  const resolvedCountry = preferredCountry ?? match;

  return {
    country: resolvedCountry,
    nationalNumber: raw.slice(resolvedCountry.dialCode.length).trim(),
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
