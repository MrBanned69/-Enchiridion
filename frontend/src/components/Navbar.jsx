"use client";

import { useState } from "react";

export default function Navbar() {
  const [notifications, setNotifications] = useState(false);

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">

      {/* Izquierda */}
      <div className="flex items-center gap-4">

        <div>
          <p className="text-xs text-slate-400">
            Sucursal
          </p>

          <button className="font-medium text-slate-700">
            Casa Matriz ▼
          </button>
        </div>

        <div className="hidden h-8 w-px bg-slate-200 md:block" />

        <div className="hidden text-sm text-green-600 md:block">
          ● Caja N.º 1: Abierta
        </div>
      </div>

      {/* Derecha */}
      <div className="flex items-center gap-4">

        {/* Búsqueda */}
        <button className="hidden items-center gap-3 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400 md:flex">
          <span>🔍</span>
          <span>Buscar...</span>
          <kbd className="rounded bg-slate-100 px-2 py-1 text-xs">
            Ctrl K
          </kbd>
        </button>

        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setNotifications(!notifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100"
          >
            🔔

            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {notifications && (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
              <h3 className="font-semibold text-slate-800">
                Notificaciones
              </h3>

              <div className="mt-4 space-y-3">
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-700">
                    Stock crítico
                  </p>

                  <p className="text-xs text-red-500">
                    24 títulos necesitan reposición.
                  </p>
                </div>

                <div className="rounded-lg bg-yellow-50 p-3">
                  <p className="text-sm font-medium text-yellow-700">
                    Compras pendientes
                  </p>

                  <p className="text-xs text-yellow-600">
                    2 órdenes esperan aprobación.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Usuario */}
        <button className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            JD
          </div>

          <div className="hidden text-left md:block">
            <p className="text-sm font-medium text-slate-700">
              Juan Pérez
            </p>

            <p className="text-xs text-slate-400">
              Administrador
            </p>
          </div>

          <span className="text-slate-400">
            ▼
          </span>
        </button>

      </div>
    </header>
  );
}