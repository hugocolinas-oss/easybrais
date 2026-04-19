"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  match: string;
  icon: (active: boolean) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Inicio",
    href: "/",
    match: "^/$",
    icon: (a) => (
      <svg className="h-5 w-5" fill={a ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={a ? 0 : 1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    label: "Operativa",
    href: "/operativa",
    match: "^/operativa",
    icon: (a) => (
      <svg className="h-5 w-5" fill={a ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={a ? 0 : 1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.079-.481 1.09-1.101C21.534 12.891 18.322 9.75 14.25 9.75H5.25m0 0L9 6m-3.75 3.75L9 13.5" />
      </svg>
    ),
  },
  {
    label: "Ruta",
    href: "/ruta",
    match: "^/ruta",
    icon: (a) => (
      <svg className="h-5 w-5" fill={a ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={a ? 0 : 1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
  {
    label: "Reservas",
    href: "/reservas",
    match: "^/reservas",
    icon: (a) => (
      <svg className="h-5 w-5" fill={a ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={a ? 0 : 1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    label: "Cierres",
    href: "/cierres",
    match: "^/cierres",
    icon: (a) => (
      <svg className="h-5 w-5" fill={a ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={a ? 0 : 1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm safe-b lg:hidden">
      <div className="grid h-16 grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = new RegExp(item.match).test(pathname);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                active
                  ? "text-brand-600"
                  : "text-gray-400 active:text-gray-600"
              }`}
            >
              {item.icon(active)}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
