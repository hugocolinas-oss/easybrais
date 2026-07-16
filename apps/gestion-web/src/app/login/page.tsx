import { LoginForm } from "@/components/login-form";
import { BrandRoutePattern } from "@/components/brand-route-pattern";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50">
      <BrandRoutePattern className="absolute inset-x-0 top-0 h-36 w-full opacity-50" />
      <div className="relative w-full max-w-sm space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-700">Easy Brais</h1>
          <h2 className="mt-2 text-lg font-semibold text-gray-900">
            Iniciar sesión
          </h2>
          <p className="mt-1 text-sm text-gray-500">Panel de gestión</p>
        </div>
        <LoginForm searchParams={searchParams} />
      </div>
    </div>
  );
}
