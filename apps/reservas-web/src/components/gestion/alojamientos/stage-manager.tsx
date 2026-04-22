"use client";

import { useTransition, useState } from "react";
import type { StageInfo } from "@/lib/gestion/accommodation-queries";
import { toggleStageActive, toggleStageVisibility } from "@/app/gestion/(dashboard)/alojamientos/actions";

interface Props {
  stages: StageInfo[];
}

export function StageManager({ stages }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleToggleActive(stageName: string, active: boolean) {
    startTransition(async () => {
      const res = await toggleStageActive(stageName, active);
      if ("ok" in res) {
        setFeedback(`${active ? "Activados" : "Desactivados"} ${res.count} alojamientos en "${stageName}"`);
      } else {
        setFeedback(`Error: ${res.error}`);
      }
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  function handleToggleVisibility(stageName: string, visible: boolean) {
    startTransition(async () => {
      const res = await toggleStageVisibility(stageName, visible);
      if ("ok" in res) {
        setFeedback(`${visible ? "Visibles" : "Ocultos"} ${res.count} alojamientos en "${stageName}"`);
      } else {
        setFeedback(`Error: ${res.error}`);
      }
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  if (stages.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          <span className="text-sm font-semibold text-gray-700">Gestionar etapas</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">{stages.length}</span>
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div className={`border-t border-gray-100 ${pending ? "pointer-events-none opacity-60" : ""}`}>
          {feedback && (
            <div className="mx-4 mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
              {feedback}
            </div>
          )}

          <div className="divide-y divide-gray-50 px-4 py-2">
            {stages.map((s) => {
              const allActive = s.active === s.total;
              const allVisible = s.visible === s.total;
              const noneActive = s.active === 0;

              return (
                <div key={s.name} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-bold text-brand-700">
                    {s.stageNumber < 999 ? s.stageNumber : "?"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{s.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {s.total} aloj. &middot; {s.active} activos &middot; {s.visible} visibles
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(s.name, !allActive)}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                        allActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : noneActive
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      }`}
                      title={allActive ? "Desactivar toda la etapa" : "Activar toda la etapa"}
                    >
                      {allActive ? "Activa" : noneActive ? "Inactiva" : `${s.active}/${s.total}`}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(s.name, !allVisible)}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                        allVisible
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                      title={allVisible ? "Ocultar toda la etapa" : "Mostrar toda la etapa"}
                    >
                      {allVisible ? "Visible" : `${s.visible}/${s.total}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
