"use client";

import Image from "next/image";
import { BRAND_LOGO_SRC } from "@/lib/brand";

const SIZES = { xs: 28, sm: 36, md: 40, lg: 80, xl: 96, "2xl": 112 } as const;

type Size = keyof typeof SIZES;

export function BrandLogo({
  size = "md",
  className = "",
  imgClassName = "",
  priority = false,
}: {
  size?: Size;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}) {
  const d = SIZES[size];
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl ${className}`}
      style={{ width: d, height: d }}
    >
      <Image
        src={BRAND_LOGO_SRC}
        alt="Easy Brais"
        fill
        className={`object-contain ${imgClassName}`}
        sizes={`${d}px`}
        priority={priority}
      />
    </div>
  );
}
