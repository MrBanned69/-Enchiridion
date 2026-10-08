"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ErpIcon from "@/components/ErpIcon";

export default function ComprasNav() {
  const esReporte = usePathname() === "/compras/reportes/historico";

  return (
    <nav className="ventas-subnav" aria-label="Navegación de compras">
      <Link
        href="/compras"
        className={`ventas-subnav-link ${!esReporte ? "is-active" : ""}`}
        aria-current={!esReporte ? "page" : undefined}
      >
        <ErpIcon name="purchases" />
        Órdenes de compra
      </Link>
      <Link
        href="/compras/reportes/historico"
        className={`ventas-subnav-link ${esReporte ? "is-active" : ""}`}
        aria-current={esReporte ? "page" : undefined}
      >
        <ErpIcon name="trend" />
        Reporte histórico
      </Link>
    </nav>
  );
}
