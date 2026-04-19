"use client";

import { useTransition } from "react";
import { toggleActive, toggleVisibility, markVerified } from "@/app/gestion/(dashboard)/alojamientos/actions";

interface ToggleProps {
  id: string;
  active: boolean;
}

export function ToggleActiveButton({ id, active }: ToggleProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await toggleActive(id, !active); })}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
        active
          ? "bg-green-50 text-green-700 hover:bg-green-100"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      } ${pending ? "opacity-50" : ""}`}
      title={active ? "Desactivar" : "Activar"}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-500" : "bg-gray-400"}`} />
      {active ? "Activo" : "Inactivo"}
    </button>
  );
}

interface VisibleProps {
  id: string;
  visible: boolean;
}

export function ToggleVisibleButton({ id, visible }: VisibleProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await toggleVisibility(id, !visible); })}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
        visible
          ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      } ${pending ? "opacity-50" : ""}`}
      title={visible ? "Ocultar en reservas" : "Mostrar en reservas"}
    >
      {visible ? "Visible" : "Oculto"}
    </button>
  );
}

interface VerifyProps {
  id: string;
}

export function MarkVerifiedButton({ id }: VerifyProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await markVerified(id); })}
      className={`rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 active:bg-gray-100 ${pending ? "opacity-50" : ""}`}
    >
      {pending ? "Verificando..." : "Marcar verificado"}
    </button>
  );
}
