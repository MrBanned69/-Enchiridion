"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ErpIcon from "@/components/ErpIcon";

export default function VentasNav() {
  const pathname = usePathname();

  const esReporte = pathname === "/ventas/reporte";

  return (
    <nav className="ventas-subnav" aria-label="Navegación de ventas">
      <Link
        href="/ventas"
        className={`ventas-subnav-link ${
          !esReporte ? "is-active" : ""
        }`}
        aria-current={!esReporte ? "page" : undefined}
      >
        <ErpIcon name="sales" />
        Registrar venta
      </Link>

      <Link
        href="/ventas/reporte"
        className={`ventas-subnav-link ${
          esReporte ? "is-active" : ""
        }`}
        aria-current={esReporte ? "page" : undefined}
      >
        <ErpIcon name="trend" />
        Reportes
      </Link>
    </nav>
  );
}
