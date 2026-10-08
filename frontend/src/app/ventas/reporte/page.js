"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import ErpModuleShell from "@/components/ErpModuleShell";
import VentasNav from "@/components/VentasNav";

function formatMoney(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-CL").format(Number(value) || 0);
}

export default function ReporteVentasPage() {
  const { usuario, loading } = useAuth();

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const [reporte, setReporte] = useState([]);
  const [resumen, setResumen] = useState({
    total_clientes: 0,
    total_ventas: 0,
    total_vendido: 0,
  });

  const [cargandoReporte, setCargandoReporte] = useState(false);
  const [error, setError] = useState("");

  async function cargarReporte() {
    try {
      setCargandoReporte(true);
      setError("");

      const params = new URLSearchParams();

      if (desde) {
        params.set("desde", desde);
      }

      if (hasta) {
        params.set("hasta", hasta);
      }

      const query = params.toString();

      const response = await fetch(
        `/api/ventas/reporte-clientes${query ? `?${query}` : ""}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "No se pudo cargar el reporte.",
        );
      }

      setReporte(result.reporte || []);

      setResumen({
        total_clientes: result.total_clientes || 0,
        total_ventas: result.total_ventas || 0,
        total_vendido: result.total_vendido || 0,
      });
    } catch (err) {
      setReporte([]);

      setResumen({
        total_clientes: 0,
        total_ventas: 0,
        total_vendido: 0,
      });

      setError(
        err.message || "No se pudo cargar el reporte.",
      );
    } finally {
      setCargandoReporte(false);
    }
  }

  function limpiarFiltros() {
    setDesde("");
    setHasta("");
  }

  useEffect(() => {
    if (!loading && usuario) {
      cargarReporte();
    }
  }, [loading, usuario]);

  if (loading) {
    return null;
  }

  return (
    <ErpModuleShell
      usuario={usuario}
      module="ventas"
      title="Reportes de ventas"
      description="Consulta el ranking de ventas por cliente y analiza la concentración de ingresos."
      subnav={<VentasNav />}
      liveData={true}
    >
      <div className="ventas-report">
        <section className="erp-card ventas-report-filters">
          <div className="erp-card-header">
            <div>
              <h2>Filtros del reporte</h2>
              <p>
                Selecciona un período para analizar las ventas
                realizadas.
              </p>
            </div>
          </div>

          <div className="ventas-report-filter-grid">
            <label className="erp-field">
              <span>Desde</span>
              <input
                type="date"
                value={desde}
                onChange={(event) => setDesde(event.target.value)}
              />
            </label>

            <label className="erp-field">
              <span>Hasta</span>
              <input
                type="date"
                value={hasta}
                onChange={(event) => setHasta(event.target.value)}
              />
            </label>

            <div className="ventas-report-filter-actions">
              <button
                type="button"
                className="erp-button erp-button-primary"
                onClick={cargarReporte}
                disabled={cargandoReporte}
              >
                {cargandoReporte
                  ? "Generando..."
                  : "Generar reporte"}
              </button>

              <button
                type="button"
                className="erp-button erp-button-secondary"
                onClick={limpiarFiltros}
                disabled={cargandoReporte}
              >
                Limpiar
              </button>
            </div>
          </div>

          {error && (
            <div className="erp-alert erp-alert-error">
              {error}
            </div>
          )}
        </section>

        <section className="ventas-report-summary">
          <article className="erp-card ventas-report-summary-card">
            <span className="ventas-report-summary-label">
              Clientes con ventas
            </span>

            <strong>
              {formatNumber(resumen.total_clientes)}
            </strong>
          </article>

          <article className="erp-card ventas-report-summary-card">
            <span className="ventas-report-summary-label">
              Ventas realizadas
            </span>

            <strong>
              {formatNumber(resumen.total_ventas)}
            </strong>
          </article>

          <article className="erp-card ventas-report-summary-card">
            <span className="ventas-report-summary-label">
              Total vendido
            </span>

            <strong>
              {formatMoney(resumen.total_vendido)}
            </strong>
          </article>
        </section>

        <section className="erp-card ventas-report-table-card">
          <div className="erp-card-header">
            <div>
              <h2>Ranking de ventas por cliente</h2>
              <p>
                Clientes ordenados desde el mayor monto vendido
                hasta el menor.
              </p>
            </div>
          </div>

          {cargandoReporte ? (
            <div className="ventas-report-empty">
              Generando reporte...
            </div>
          ) : reporte.length === 0 ? (
            <div className="ventas-report-empty">
              No existen ventas para el período seleccionado.
            </div>
          ) : (
            <div className="ventas-report-table-wrapper">
              <table className="ventas-report-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>RUT</th>
                    <th>Ventas</th>
                    <th>Total vendido</th>
                    <th>% del total</th>
                    <th>% acumulado</th>
                  </tr>
                </thead>

                <tbody>
                  {reporte.map((fila) => (
                    <tr key={fila.id_cliente}>
                      <td>{fila.posicion}</td>

                      <td>
                        <strong>{fila.nombre}</strong>
                      </td>

                      <td>{fila.rut}</td>

                      <td>
                        {formatNumber(fila.cantidad_ventas)}
                      </td>

                      <td>
                        {formatMoney(fila.total_vendido)}
                      </td>

                      <td>
                        {Number(fila.porcentaje || 0).toFixed(2)}%
                      </td>

                      <td>
                        {Number(
                          fila.porcentaje_acumulado || 0,
                        ).toFixed(2)}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </ErpModuleShell>
  );
}