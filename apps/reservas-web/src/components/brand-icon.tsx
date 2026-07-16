import type { SVGProps } from "react";

export type BrandIconName =
  | "backpack"
  | "pilgrim"
  | "hotel"
  | "hostel"
  | "transport"
  | "map"
  | "location"
  | "route"
  | "calendar"
  | "clock"
  | "confirmation"
  | "euro"
  | "phone"
  | "whatsapp"
  | "mail"
  | "delivery"
  | "sun"
  | "rain"
  | "accommodation"
  | "camino";

const ACCENT = "#C49A6C";
const ACCENT_FILL = "#F9EDDA";

interface BrandIconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: BrandIconName;
}

export function BrandIcon({ name, className = "h-5 w-5", ...props }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <IconPaths name={name} />
    </svg>
  );
}

export function BrandIconTile({
  name,
  size = "md",
  tone = "light",
  className = "",
}: {
  name: BrandIconName;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark" | "solid" | "plain";
  className?: string;
}) {
  const sizes = {
    sm: "h-7 w-7 rounded-lg [&>svg]:h-4 [&>svg]:w-4",
    md: "h-9 w-9 rounded-xl [&>svg]:h-5 [&>svg]:w-5",
    lg: "h-11 w-11 rounded-xl [&>svg]:h-6 [&>svg]:w-6",
  };
  const tones = {
    light: "bg-brand-50 text-brand-900 ring-1 ring-inset ring-brand-100",
    dark: "bg-white/10 text-white ring-1 ring-inset ring-white/10",
    solid: "bg-brand-900 text-white ring-1 ring-inset ring-brand-950/20",
    plain: "bg-transparent text-brand-900",
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${sizes[size]} ${tones[tone]} ${className}`}
      aria-hidden="true"
    >
      <BrandIcon name={name} />
    </span>
  );
}

function IconPaths({ name }: { name: BrandIconName }) {
  switch (name) {
    case "backpack":
      return (
        <>
          <path d="M8.5 6V4.8c0-1 1-1.8 2.2-1.8h2.6c1.2 0 2.2.8 2.2 1.8V6" />
          <rect x="5" y="5.8" width="14" height="15" rx="3" />
          <path d="M8 9h8M8 13v5M16 13v5" />
          <path d="M5 11H3.8v6H5M19 11h1.2v6H19" />
          <path d="m12 13-1.8 2.3L12 18l1.8-2.7L12 13Z" fill={ACCENT_FILL} stroke={ACCENT} />
        </>
      );
    case "pilgrim":
      return (
        <>
          <circle cx="11" cy="6" r="2.4" />
          <path d="M7.5 5.3c1.2-2 5.2-2 7 0M8.3 4h5.8M9 8.5l-2 4.2v6.8M13 8.5l2.3 4v7M7 12.7h8.3M5 20h12" />
          <path d="M18.5 7v13M17 7c.5-1.7 2.5-1.7 3 0" stroke={ACCENT} />
        </>
      );
    case "hotel":
      return (
        <>
          <path d="M5 21V7h14v14M8 10h2v2H8zM14 10h2v2h-2zM8 15h2v2H8zM14 15h2v2h-2zM10 21v-2h4v2" />
          <rect x="7" y="3" width="10" height="3.5" rx="1" fill={ACCENT_FILL} stroke={ACCENT} />
          <path d="M9 5h6" />
        </>
      );
    case "hostel":
      return (
        <>
          <path d="m3.5 10 8.5-7 8.5 7M5 8.8V21h14V8.8M9 21v-6h6v6" />
          <path d="m12 7-1.7 2.2L12 12l1.7-2.8L12 7Z" fill={ACCENT_FILL} stroke={ACCENT} />
        </>
      );
    case "transport":
      return (
        <>
          <path d="M3 16V9.5c0-1 .7-1.8 1.7-2L15 5.5c1.4-.3 2.7.5 3.2 1.8l1 2.7H21v6H3Z" />
          <path d="M6 8h4l-1 4H4M12 7.2h4l1.5 4.8H11l1-4.8Z" />
          <circle cx="7" cy="17" r="2" fill={ACCENT_FILL} stroke={ACCENT} />
          <circle cx="17" cy="17" r="2" fill={ACCENT_FILL} stroke={ACCENT} />
        </>
      );
    case "map":
      return (
        <>
          <path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6ZM9 4v14M15 6v14" />
          <path d="M17 8.2a2.2 2.2 0 1 1 4.4 0c0 2-2.2 3.8-2.2 3.8S17 10.2 17 8.2Z" fill={ACCENT_FILL} stroke={ACCENT} />
        </>
      );
    case "location":
      return (
        <>
          <path d="M12 21s6-5 6-11a6 6 0 1 0-12 0c0 6 6 11 6 11Z" />
          <circle cx="12" cy="10" r="2.2" fill={ACCENT_FILL} stroke={ACCENT} />
          <path d="M8 21h8" />
        </>
      );
    case "route":
      return (
        <>
          <path d="M5.2 17.5h3.3c2 0 3-1.1 3-3.1v-4c0-2 1-3 3-3h3" strokeDasharray="2.5 2.5" />
          <path d="M3 17.5a2.2 2.2 0 1 1 4.4 0C7.4 19.4 5.2 21 5.2 21S3 19.4 3 17.5ZM16.5 6.8a2.2 2.2 0 1 1 4.4 0c0 1.9-2.2 3.5-2.2 3.5s-2.2-1.6-2.2-3.5Z" fill={ACCENT_FILL} stroke={ACCENT} />
        </>
      );
    case "calendar":
      return (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4M17 3v4M3 9h18" />
          <path d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2M15 17h2" stroke={ACCENT} />
        </>
      );
    case "clock":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l-3 2" />
          <circle cx="12" cy="12" r="1" fill={ACCENT} stroke="none" />
        </>
      );
    case "confirmation":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.6 2.6L16.5 9" stroke={ACCENT} strokeWidth={2} />
        </>
      );
    case "euro":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M16 7.8a5.5 5.5 0 1 0 0 8.4M7.5 10h6M7.5 14h6" stroke={ACCENT} />
        </>
      );
    case "phone":
      return (
        <>
          <path d="M7.3 3.5 10 7.8 7.8 10c1.3 2.8 3.4 4.9 6.2 6.2l2.2-2.2 4.3 2.7c.5.3.7.9.5 1.4-.7 1.8-2.4 3-4.4 2.7C9.8 19.8 4.2 14.2 3.2 7.4c-.3-2 .9-3.7 2.7-4.4.5-.2 1.1 0 1.4.5Z" />
          <path d="m16.2 14 4.3 2.7" stroke={ACCENT} />
        </>
      );
    case "whatsapp":
      return (
        <>
          <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z" />
          <path d="M9 8.5c.8 3 2.6 4.8 5.5 6l1.3-1.3" stroke={ACCENT} />
        </>
      );
    case "mail":
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 7 8 6 8-6" />
          <path d="m4 18 5.5-5M20 18l-5.5-5" stroke={ACCENT} />
        </>
      );
    case "delivery":
      return (
        <>
          <path d="M7 3h10v18H7zM5 7h2M17 7h2M5 17h2M17 17h2" />
          <path d="m12 8-1.7 2.2L12 13l1.7-2.8L12 8Z" fill={ACCENT_FILL} stroke={ACCENT} />
          <path d="M10 17h4" />
        </>
      );
    case "sun":
      return (
        <>
          <circle cx="12" cy="12" r="4" fill={ACCENT_FILL} stroke={ACCENT} />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
        </>
      );
    case "rain":
      return (
        <>
          <path d="M7 16a4 4 0 1 1 1.2-7.8A5.5 5.5 0 0 1 18.7 10 3 3 0 0 1 18 16H7Z" />
          <path d="m8 19-1 2M13 19l-1 2M18 19l-1 2" stroke={ACCENT} />
        </>
      );
    case "accommodation":
      return (
        <>
          <path d="M3 19V8M21 19V8M3 15h18M6 15v-4h6a3 3 0 0 1 3 3v1M6 11V8h4a2 2 0 0 1 2 2v1" />
          <path d="M3 19v2M21 19v2" stroke={ACCENT} />
        </>
      );
    case "camino":
      return (
        <>
          <path d="M12 20C9 17 6 13.5 6 9.5A6 6 0 0 1 18 9.5C18 13.5 15 17 12 20Z" />
          <path d="M12 7v9M8.5 9.5 12 16l3.5-6.5M9.5 12h5" stroke={ACCENT} />
        </>
      );
  }
}
