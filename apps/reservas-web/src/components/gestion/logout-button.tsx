"use client";

import { logoutAction } from "@/app/gestion/login/logout-action";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="mt-2 w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
