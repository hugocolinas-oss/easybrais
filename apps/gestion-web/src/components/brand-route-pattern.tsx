type BrandRoutePatternProps = {
  className?: string;
  tone?: "light" | "dark";
};

export function BrandRoutePattern({ className = "", tone = "light" }: BrandRoutePatternProps) {
  const contour = tone === "dark" ? "#FFFFFF" : "#0B3D2E";
  const route = tone === "dark" ? "#F3E5CF" : "#0B3D2E";
  const accent = tone === "dark" ? "#E8BC84" : "#C48E3F";

  return (
    <svg aria-hidden="true" className={`pointer-events-none select-none ${className}`} fill="none" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1200 140" xmlns="http://www.w3.org/2000/svg">
      <g stroke={contour} strokeLinecap="round" strokeWidth="1.25" opacity={tone === "dark" ? 0.13 : 0.1}>
        <path d="M-25 35C34 18 72 19 100 43s32 52 83 43 43-60 98-63 50 56 103 53 62-54 123-50 48 63 105 66 69-50 128-42 54 60 115 55 58-52 113-49 62 49 116 46 68-42 132-25" />
        <path d="M-31 53C32 34 67 36 91 58s38 52 92 42 46-61 101-63 53 57 101 54 65-54 119-50 52 64 109 65 68-48 128-41 56 59 117 54 60-51 113-46 63 47 120 42 71-41 129-20" />
        <path d="M-24 75C27 58 62 56 87 77s43 49 97 37 47-58 99-59 58 54 103 50 65-49 117-44 56 58 111 60 70-44 127-37 59 55 119 50 61-46 113-40 65 42 120 37 66-35 127-15" />
        <path d="M8 4c37 22 58 19 81 4M250 138c28-24 52-25 83-5M773 3c35 25 59 24 91 1M1054 139c38-27 70-28 109-5" />
      </g>
      <path d="M-10 74C78 16 135 124 224 70s143-7 218 13 130-64 211-19 137 50 224-3 151 56 333-8" stroke={route} strokeDasharray="5 8" strokeLinecap="round" strokeWidth="2" opacity={tone === "dark" ? 0.42 : 0.34} />
      <g stroke={accent} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" opacity={tone === "dark" ? 0.76 : 0.68}>
        <g transform="translate(121 31)"><path d="M11 28s-8-8-8-16a8 8 0 0 1 16 0c0 8-8 16-8 16Z" /><circle cx="11" cy="12" r="2.5" /></g>
        <g transform="translate(345 44)"><path d="M12 30V14M12 30 4 14M12 30 20 14M12 30 1 20M12 30l11-10M12 30 5 25M12 30l7-5" /><path d="M1 20c1-9 5-14 11-18 6 4 10 9 11 18" /></g>
        <g transform="translate(700 24)"><path d="M11 28s-8-8-8-16a8 8 0 0 1 16 0c0 8-8 16-8 16Z" /><circle cx="11" cy="12" r="2.5" /></g>
        <g transform="translate(1084 56)"><path d="M12 30V14M12 30 4 14M12 30 20 14M12 30 1 20M12 30l11-10M12 30 5 25M12 30l7-5" /><path d="M1 20c1-9 5-14 11-18 6 4 10 9 11 18" /></g>
      </g>
      <g stroke={route} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" opacity={tone === "dark" ? 0.58 : 0.48}>
        <path d="m270 55-9 4 9 4M261 59h18M898 49l9 4-9 4M907 53h-18" />
        <g transform="translate(522 56)"><rect x="2" y="6" width="22" height="24" rx="5" /><path d="M8 6V4c0-3 10-3 10 0v2M8 14h10M7 30v3m12-3v3M2 19h22" /><path d="M9 24c3-4 7-4 10 0" stroke={accent} /></g>
      </g>
    </svg>
  );
}
