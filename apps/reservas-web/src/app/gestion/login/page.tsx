import Image from "next/image";
import { LoginForm } from "@/components/gestion/login-form";
import { BRAND_LOGO_SRC } from "@/lib/brand";
import { BrandRoutePattern } from "@/components/brand-route-pattern";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-cream-100">
      <div className="relative overflow-hidden bg-brand-900 px-6 pb-10 pt-12 text-center sm:pb-12 sm:pt-14">
        <BrandRoutePattern tone="dark" className="absolute inset-0 h-full w-full opacity-55" />
        <div className="relative mx-auto flex flex-col items-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/20 sm:h-24 sm:w-24">
            <Image src={BRAND_LOGO_SRC} alt="Easy Brais" fill className="object-contain p-1" sizes="96px" priority />
          </div>
          <h1 className="mt-5 text-xl font-bold tracking-tight text-white sm:text-2xl">Easy Brais</h1>
          <p className="mt-1 text-sm text-white/55">Panel de gestión · Camino Portugués</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-12 pt-2">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-brand-900">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-brand-800/45">Accede con tu cuenta de operador</p>
          </div>
          <LoginForm searchParams={searchParams} />
        </div>
      </div>
    </div>
  );
}
