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

  const [cargandoReporte, setCargandoReporte] = useState(true);
  const [error, setError] = useState("");
  const [filtrosAplicados, setFiltrosAplicados] = useState({ desde: "", hasta: "", revision: 0 });

  function cargarReporte() {
    setCargandoReporte(true);
    setError("");
    setFiltrosAplicados((current) => ({ desde, hasta, revision: current.revision + 1 }));
  }

  function limpiarFiltros() {
    setDesde("");
    setHasta("");
    setCargandoReporte(true);
    setError("");
    setFiltrosAplicados((current) => ({ desde: "", hasta: "", revision: current.revision + 1 }));
  }

  useEffect(() => {
    if (loading || !usuario) return;
    const controller = new AbortController();
    async function consultarReporte() {
    try {
      const params = new URLSearchParams();

      if (filtrosAplicados.desde) {
        params.set("desde", filtrosAplicados.desde);
      }

      if (filtrosAplicados.hasta) {
        params.set("hasta", filtrosAplicados.hasta);
      }

      const query = params.toString();

      const response = await fetch(
        `/api/ventas/reporte-clientes${query ? `?${query}` : ""}`,
        {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        },
      );

      const result = await response.json();
      if (controller.signal.aborted) return;

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
      if (controller.signal.aborted) return;
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
      if (!controller.signal.aborted) setCargandoReporte(false);
    }
    }
    consultarReporte();
    return () => controller.abort();
  }, [loading, usuario, filtrosAplicados]);

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
            <div className="erp-alert erp-alert-error" role="alert">
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
              {cargandoReporte || error ? "—" : formatNumber(resumen.total_clientes)}
            </strong>
          </article>

          <article className="erp-card ventas-report-summary-card">
            <span className="ventas-report-summary-label">
              Ventas realizadas
            </span>

            <strong>
              {cargandoReporte || error ? "—" : formatNumber(resumen.total_ventas)}
            </strong>
          </article>

          <article className="erp-card ventas-report-summary-card">
            <span className="ventas-report-summary-label">
              Total vendido
            </span>

            <strong>
              {cargandoReporte || error ? "—" : formatMoney(resumen.total_vendido)}
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
            <div className="ventas-report-empty" role="status">
              Generando reporte...
            </div>
          ) : reporte.length === 0 ? (
            <div className="ventas-report-empty" role="status">
              {error ? "El reporte no está disponible. Intenta generarlo nuevamente." : "No existen ventas para el período seleccionado."}
            </div>
          ) : (
            <div className="ventas-report-table-wrapper" tabIndex={0} role="region" aria-label="Ranking de clientes; tabla desplazable">
              <table className="ventas-report-table">
                <caption className="module-visually-hidden">Ranking de ventas por cliente</caption>
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">RUT</th>
                    <th scope="col">Ventas</th>
                    <th scope="col">Total vendido</th>
                    <th scope="col">% del total</th>
                    <th scope="col">% acumulado</th>
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
