"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ErpIcon from "@/components/ErpIcon";
import "../erp.css";

export default function InventarioModule() {
  const [search, setSearch] = useState("");
  // Empezamos con el inventario vacío porque ahora viene de la base de datos
  const [inventario, setInventario] = useState([]);
  const [nombreUsuario, setNombreUsuario] = useState("Administrador");
  const [vistaReporte, setVistaReporte] = useState(false); // Para alternar entre Pantalla 1 y Reporte 1
  const [cargando, setCargando] = useState(true);
  const [errorConexion, setErrorConexion] = useState(false);

  useEffect(() => {
    // 1. Recuperamos el nombre del usuario conectado
    const guardado = localStorage.getItem("nombre_usuario");
    if (guardado) setNombreUsuario(guardado);

    // 2. Conectamos con el backend en C# para traer los datos de MySQL
    // OJO: Si Visual Studio te abre otro puerto distinto al 44379, cámbialo aquí abajo.
    fetch("https://localhost:44379/Inventario/ListarInventario")
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error("Error en el servidor");
        return respuesta.json();
      })
      .then((datos) => {
        if (!datos.error) {
          setInventario(datos);
        } else {
          setErrorConexion(true);
        }
      })
      .catch((error) => {
        console.error("Error conectando al backend:", error);
        setErrorConexion(true);
      })
      .finally(() => {
        setCargando(false);
      });
  }, []);

  // Filtramos la búsqueda para la Pantalla 1
  const librosFiltrados = inventario.filter((item) =>
    `${item.titulo} ${item.autor} ${item.categoria}`
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  // Filtramos solo los que están en stock crítico para el Reporte 1
  const librosCriticos = inventario.filter((item) => item.stock <= item.minimo);

  return (
    <div className="erp-screen erp-home" lang="es">
      <aside className="erp-sidebar">
        <Link href="/" className="erp-brand" aria-label="Librería ERP, inicio">
          <span className="erp-brand-icon">
            <ErpIcon name="book" />
          </span>
          <span>
            Librería <b>ERP</b>
            <small>SISTEMA DE GESTIÓN</small>
          </span>
        </Link>
        <nav aria-label="Navegación principal">
          <p className="erp-nav-label">PRINCIPAL</p>
          <Link href="/" className="erp-nav-item">
            <ErpIcon name="home" />
            Inicio
          </Link>
          <p className="erp-nav-label">GESTIÓN</p>
          
          <button
            onClick={() => setVistaReporte(false)}
            className={`erp-nav-item ${!vistaReporte ? "is-active" : ""}`}
            style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
          >
            <ErpIcon name="inventory" />
            Inventario General
          </button>
          
          <button
            onClick={() => setVistaReporte(true)}
            className={`erp-nav-item ${vistaReporte ? "is-active" : ""}`}
            style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
          >
            <ErpIcon name="accounting" />
            Reporte Crítico
          </button>
        </nav>
        <div className="erp-sidebar-user">
          <span className="erp-avatar">{(nombreUsuario || "AD").substring(0,2).toUpperCase()}</span>
          <div>
            <strong>{nombreUsuario}</strong>
            <small>Sesión activa</small>
          </div>
          <Link href="/login" title="Cerrar sesión">
            <ErpIcon name="logout" />
          </Link>
        </div>
      </aside>

      <div className="erp-workspace">
        <header className="erp-topbar">
          <div className="erp-branch">
            <span className="erp-muted">Módulo de Inventario</span>
            <strong>{vistaReporte ? "Reporte: Stock Crítico de Títulos" : "Gestión y Control de Bodega"}</strong>
          </div>
          <span className="erp-demo-badge">Conectado a C#</span>
        </header>

        <main id="main-content" className="erp-main">
          {errorConexion && (
            <div className="erp-demo-note" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
              <ErpIcon name="info" />
              <span>No se pudo conectar con el backend de C#. Asegúrate de que Visual Studio esté ejecutándose (Play).</span>
            </div>
          )}

          {cargando ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <h2>Cargando inventario desde la base de datos...</h2>
            </div>
          ) : !vistaReporte ? (
            /* ================= PANTALLA 1: GESTIÓN DE INVENTARIO ================= */
            <>
              <div className="erp-page-heading">
                <div>
                  <p className="erp-eyebrow">CONTROL DE EXISTENCIAS</p>
                  <h1>Inventario de Libros</h1>
                  <p className="erp-muted">Supervisa los niveles de stock, estantes y precios de venta actuales.</p>
                </div>
                <button
                  onClick={() => setVistaReporte(true)}
                  className="erp-primary-button"
                  style={{
                    backgroundColor: "#2563eb",
                    color: "white",
                    padding: "10px 16px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Ver Reporte de Stock Crítico
                </button>
              </div>

              <section className="erp-card" style={{ padding: "20px", marginBottom: "20px" }}>
                <label className="erp-search" style={{ maxWidth: "100%" }}>
                  <ErpIcon name="search" />
                  <input
                    type="search"
                    placeholder="Buscar por título, autor o categoría..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </section>

              <section className="erp-card" style={{ padding: "20px", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #eaeaea", color: "#666", fontSize: "0.85rem" }}>
                      <th style={{ padding: "12px" }}>ISBN</th>
                      <th style={{ padding: "12px" }}>Título</th>
                      <th style={{ padding: "12px" }}>Autor</th>
                      <th style={{ padding: "12px" }}>Estante</th>
                      <th style={{ padding: "12px" }}>Precio</th>
                      <th style={{ padding: "12px" }}>Stock</th>
                      <th style={{ padding: "12px" }}>Estado Operativo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {librosFiltrados.map((libro) => {
                      const esCritico = libro.stock <= libro.minimo;
                      return (
                        <tr key={libro.isbn} style={{ borderBottom: "1px solid #f2f2f2" }}>
                          <td style={{ padding: "12px", fontFamily: "monospace", fontSize: "0.85rem" }}>{libro.isbn}</td>
                          <td style={{ padding: "12px", fontWeight: "600" }}>{libro.titulo}</td>
                          <td style={{ padding: "12px", color: "#555" }}>{libro.autor}</td>
                          <td style={{ padding: "12px" }}>{libro.estante}</td>
                          <td style={{ padding: "12px" }}>${libro.precio.toLocaleString("es-CL")}</td>
                          <td style={{ padding: "12px", fontWeight: "bold" }}>{libro.stock} un.</td>
                          <td style={{ padding: "12px" }}>
                            <span
                              className={`erp-status ${esCritico ? "danger" : "success"}`}
                              style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem" }}
                            >
                              {esCritico ? "Stock Crítico" : "Disponible"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {librosFiltrados.length === 0 && !errorConexion && (
                  <p style={{ textAlign: "center", padding: "20px", color: "#777" }}>
                    No se registran libros con los parámetros indicados.
                  </p>
                )}
              </section>
            </>
          ) : (
            /* ================= REPORTE 1: REPORTE DE STOCK CRÍTICO ================= */
            <>
              <div className="erp-page-heading">
                <div>
                  <p className="erp-eyebrow">REPORTE OFICIAL DEL SISTEMA</p>
                  <h1>Títulos que Requieren Reposición</h1>
                  <p className="erp-muted">Listado de libros cuyas existencias se encuentran bajo el umbral mínimo permitido.</p>
                </div>
                <button
                  onClick={() => setVistaReporte(false)}
                  style={{
                    backgroundColor: "#4b5563",
                    color: "white",
                    padding: "10px 16px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Volver al Inventario General
                </button>
              </div>

              <section className="erp-card" style={{ padding: "20px", overflowX: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", alignItems: "center" }}>
                  <strong>Total de títulos críticos detectados: {librosCriticos.length}</strong>
                  <span style={{ fontSize: "0.85rem", color: "#666" }}>Fecha de emisión: {new Date().toLocaleDateString('es-CL')}</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #ef4444", color: "#b91c1c", fontSize: "0.85rem" }}>
                      <th style={{ padding: "12px" }}>ISBN</th>
                      <th style={{ padding: "12px" }}>Título</th>
                      <th style={{ padding: "12px" }}>Categoría</th>
                      <th style={{ padding: "12px" }}>Stock Actual</th>
                      <th style={{ padding: "12px" }}>Stock Mínimo Requerido</th>
                      <th style={{ padding: "12px" }}>Déficit a Comprar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {librosCriticos.map((libro) => {
                      const deficit = libro.minimo - libro.stock;
                      return (
                        <tr key={libro.isbn} style={{ borderBottom: "1px solid #f2f2f2" }}>
                          <td style={{ padding: "12px", fontFamily: "monospace" }}>{libro.isbn}</td>
                          <td style={{ padding: "12px", fontWeight: "600" }}>{libro.titulo}</td>
                          <td style={{ padding: "12px" }}>{libro.categoria}</td>
                          <td style={{ padding: "12px", color: "#dc2626", fontWeight: "bold" }}>{libro.stock} un.</td>
                          <td style={{ padding: "12px" }}>{libro.minimo} un.</td>
                          <td style={{ padding: "12px", fontWeight: "bold", color: "#2563eb" }}>+{deficit} un. (Reponer)</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {librosCriticos.length === 0 && !errorConexion && (
                  <p style={{ textAlign: "center", padding: "30px", color: "#16a34a", fontWeight: "600" }}>
                    ¡Excelente noticia! No hay libros en stock crítico en este momento.
                  </p>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}