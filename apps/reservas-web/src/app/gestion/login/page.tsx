import { LoginForm } from "@/components/gestion/login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-8 px-4">
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
