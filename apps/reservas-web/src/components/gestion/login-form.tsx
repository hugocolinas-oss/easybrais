"use client";

import { useActionState, use } from "react";
import { loginAction, type LoginState } from "@/app/gestion/login/actions";

const initialState: LoginState = { error: null };

export function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = use(searchParams);
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  const errorMessage =
    state.error ??
    (params.error === "inactive"
      ? "Tu cuenta está desactivada. Contacta al administrador."
      : params.error === "auth_callback_failed"
        ? "Error en la autenticación. Inténtalo de nuevo."
        : null);

  return (
    <form action={formAction} className="space-y-4">
      {errorMessage && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="tu@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
