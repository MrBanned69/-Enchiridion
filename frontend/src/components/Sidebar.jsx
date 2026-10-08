"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function Sidebar() {
  const { usuario, iniciales } = useAuth();
  const [openModule, setOpenModule] = useState(null);

  const toggleModule = (module) => {
    setOpenModule(openModule === module ? null : module);
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex h-20 shrink-0 items-center border-b border-slate-800 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-xl">
            📚
          </div>

          <div>
            <h1 className="font-bold">Librería ERP</h1>
            <p className="text-xs text-slate-400">Sistema de gestión</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Principal
        </p>

        <Link
          href="/"
          className="mb-2 flex items-center gap-3 rounded-lg bg-blue-600 px-3 py-3 text-sm font-medium"
        >
          <span>🏠</span>
          Dashboard
        </Link>

        <p className="mb-3 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Gestión
        </p>

        {/* Compras */}
        <button
          onClick={() => toggleModule("compras")}
          className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-slate-800"
        >
          <span className="flex items-center gap-3">
            <span>🛒</span>
            Compras
          </span>

          <span>{openModule === "compras" ? "⌃" : "⌄"}</span>
        </button>

        {openModule === "compras" && (
          <div className="mb-2 ml-9 space-y-1">
            <Link
              href="/compras"
              className="block rounded px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Órdenes de compra
            </Link>

            <Link
              href="/compras/reportes/historico"
              className="block rounded px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Reporte histórico
            </Link>

          </div>
        )}

        {/* Ventas */}
        <button
          onClick={() => toggleModule("ventas")}
          className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-slate-800"
        >
          <span className="flex items-center gap-3">
            <span>💳</span>
            Ventas
          </span>

          <span>{openModule === "ventas" ? "⌃" : "⌄"}</span>
        </button>

        {openModule === "ventas" && (
          <div className="mb-2 ml-9 space-y-1">
            <Link
              href="/ventas"
              className="block rounded px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Punto de venta
            </Link>

            <Link
              href="/ventas/historial"
              className="block rounded px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Historial
            </Link>

            <Link
              href="/ventas/cotizaciones"
              className="block rounded px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Cotizaciones
            </Link>
          </div>
        )}

        {/* Inventario */}
        <button
          onClick={() => toggleModule("inventario")}
          className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-slate-800"
        >
          <span className="flex items-center gap-3">
            <span>📦</span>
            Inventario
          </span>

          <span>{openModule === "inventario" ? "⌃" : "⌄"}</span>
        </button>

        {openModule === "inventario" && (
          <div className="mb-2 ml-9 space-y-1">
            <Link
              href="/inventario"
              className="block rounded px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Stock
            </Link>

          </div>
        )}

        {/* Contabilidad */}
        <button
          onClick={() => toggleModule("contabilidad")}
          className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-slate-800"
        >
          <span className="flex items-center gap-3">
            <span>📒</span>
            Contabilidad
          </span>

          <span>{openModule === "contabilidad" ? "⌃" : "⌄"}</span>
        </button>

        {openModule === "contabilidad" && (
          <div className="mb-2 ml-9 space-y-1">
            <Link
              href="/contabilidad"
              className="block rounded px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Libro diario
            </Link>

          </div>
        )}

        <p className="mb-3 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Sistema
        </p>

        <Link
          href="/administracion"
          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-slate-800"
        >
          <span>⚙️</span>
          Administración
        </Link>
      </nav>

      {/* Usuario */}
      <div className="shrink-0 border-t border-slate-800 p-4">
        <Link href="/mi-perfil" className="flex items-center gap-3 rounded-lg border border-slate-700 p-3 hover:bg-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold">
            {iniciales || "—"}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {usuario?.nombre || "Sin sesión"}
            </p>

            <p className="text-xs text-slate-400">{usuario?.rol || ""}</p>
            <p className="mt-1 text-xs font-semibold text-white">Mi perfil →</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
