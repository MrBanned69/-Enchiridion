"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ErpModuleShell from "@/components/ErpModuleShell";
import ErpIcon from "@/components/ErpIcon";
import {
  fetchProveedores,
  fetchRecepcionesPendientes,
  fetchDetalleParaRecepcion,
  registrarRecepcion,
  fetchHistorialRecepciones,
} from "@/lib/compras-api";

export default function RecepcionesPage() {
  const { usuario, loading: authLoading, error: authError } = useAuth();
  const router = useRouter();

  // Pestañas
  const [tabActiva, setTabActiva] = useState("pendientes"); // "pendientes" | "historial"

  // Datos auxiliares
  const [proveedores, setProveedores] = useState([]);

  // Pestaña 1: Pendientes
  const [ordenesPendientes, setOrdenesPendientes] = useState([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(true);
  const [errorPendientes, setErrorPendientes] = useState("");
  const [ordenParaRecibir, setOrdenParaRecibir] = useState(null);
  const [cargandoOrden, setCargandoOrden] = useState(false);

  // Formulario de Recepción
  const [tipoDoc, setTipoDoc] = useState("guia de despacho");
  const [nroDoc, setNroDoc] = useState("");
  const [lineasRecepcion, setLineasRecepcion] = useState([]); // [{ isbn, titulo, cantidadPedida, cantidadRecibida, cantidadPendiente, cantidadRecibir }]
  const [guardandoRecepcion, setGuardandoRecepcion] = useState(false);
  const [errorRecepcion, setErrorRecepcion] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  // Pestaña 2: Historial
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");
  const [filtroOc, setFiltroOc] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [recepcionSeleccionada, setRecepcionSeleccionada] = useState(null);

  // Redirección si no hay sesión
  useEffect(() => {
    if (!authLoading && !usuario && !authError) {
      router.replace("/login");
    }
  }, [authLoading, usuario, authError, router]);

  // Cargar proveedores para filtros
  useEffect(() => {
    if (!usuario) return;
    async function cargarProvs() {
      try {
        const data = await fetchProveedores();
        setProveedores(data);
      } catch (err) {
        console.error("Error al cargar proveedores:", err);
      }
    }
    cargarProvs();
  }, [usuario]);

  // Cargar órdenes pendientes
  const cargarPendientes = useCallback(async () => {
    setCargandoPendientes(true);
    setErrorPendientes("");
    try {
      const data = await fetchRecepcionesPendientes();
      setOrdenesPendientes(data);
    } catch (err) {
      setErrorPendientes(err.message || "No se pudieron obtener las órdenes pendientes de recepción.");
      setOrdenesPendientes([]);
    } finally {
      setCargandoPendientes(false);
    }
  }, []);

  // Cargar historial
  const cargarHistorial = useCallback(async () => {
    setCargandoHistorial(true);
    setErrorHistorial("");
    try {
      const data = await fetchHistorialRecepciones({
        oc: filtroOc ? parseInt(filtroOc, 10) : undefined,
        proveedor: filtroProveedor ? parseInt(filtroProveedor, 10) : undefined,
      });
      setHistorial(data);
    } catch (err) {
      setErrorHistorial(err.message || "No se pudo obtener el historial de recepciones.");
      setHistorial([]);
    } finally {
      setCargandoHistorial(false);
    }
  }, [filtroOc, filtroProveedor]);

  // Disparar carga según pestaña
  useEffect(() => {
    if (!usuario) return;
    if (tabActiva === "pendientes") {
      cargarPendientes();
    } else {
      cargarHistorial();
    }
  }, [usuario, tabActiva, cargarPendientes, cargarHistorial]);

  // Abrir formulario para recibir una orden
  async function seleccionarOrdenParaRecibir(idOc) {
    setCargandoOrden(true);
    setErrorRecepcion("");
    setMensajeExito("");
    try {
      const detalle = await fetchDetalleParaRecepcion(idOc);
      setOrdenParaRecibir(detalle);
      setTipoDoc("guia de despacho");
      setNroDoc("");
      setLineasRecepcion(
        (detalle.lineas || []).map((l) => ({
          isbn: l.isbn,
          titulo: l.titulo,
          cantidadPedida: l.cantidadPedida,
          cantidadRecibida: l.cantidadRecibida,
          cantidadPendiente: l.cantidadPendiente,
          cantidadRecibir: 0,
        }))
      );
    } catch (err) {
      setErrorPendientes(err.message || "Error al cargar la orden seleccionada.");
    } finally {
      setCargandoOrden(false);
    }
  }

  function cerrarModalRecepcion() {
    if (guardandoRecepcion) return;
    setOrdenParaRecibir(null);
    setErrorRecepcion("");
  }

  // Rellenar todo lo pendiente
  function recibirTodoLoPendiente() {
    setLineasRecepcion((prev) =>
      prev.map((l) => ({
        ...l,
        cantidadRecibir: l.cantidadPendiente,
      }))
    );
  }

  function cambiarCantidadRecibir(isbn, valor) {
    const parsed = Math.max(0, parseInt(valor, 10) || 0);
    setLineasRecepcion((prev) =>
      prev.map((l) => (l.isbn === isbn ? { ...l, cantidadRecibir: parsed } : l))
    );
  }

  // Registrar recepción con confirmación
  async function handleRegistrarRecepcion(event) {
    event.preventDefault();
    setErrorRecepcion("");

    if (!tipoDoc) {
      setErrorRecepcion("Debes seleccionar el tipo de documento.");
      return;
    }

    const nroDocLimpio = nroDoc.trim();
    if (!nroDocLimpio) {
      setErrorRecepcion("El número de documento es obligatorio.");
      return;
    }

    if (nroDocLimpio.length > 50) {
      setErrorRecepcion("El número de documento no puede superar 50 caracteres.");
      return;
    }

    let totalRecibir = 0;
    for (const l of lineasRecepcion) {
      if (l.cantidadRecibir < 0) {
        setErrorRecepcion(`La cantidad a recibir para el libro "${l.titulo}" no puede ser negativa.`);
        return;
      }
      if (l.cantidadRecibir > l.cantidadPendiente) {
        setErrorRecepcion(
          `La cantidad a recibir para "${l.titulo}" (${l.cantidadRecibir}) supera las unidades pendientes (${l.cantidadPendiente}).`
        );
        return;
      }
      totalRecibir += l.cantidadRecibir;
    }

    if (totalRecibir <= 0) {
      setErrorRecepcion("Debes ingresar al menos 1 unidad a recibir en alguna de las líneas.");
      return;
    }

    const confirmacion = window.confirm(
      `AVISO IMPORTANTE: Esta acción registrará el ingreso de ${totalRecibir} unidades al inventario (LIBRO.stock_actual) y no se puede deshacer.\n\n¿Estás seguro de registrar esta recepción con el documento ${tipoDoc.toUpperCase()} #${nroDocLimpio}?`
    );

    if (!confirmacion) return;

    setGuardandoRecepcion(true);
    try {
      const res = await registrarRecepcion({
        idOc: ordenParaRecibir.idOc || ordenParaRecibir.id_oc,
        tipoDoc,
        nroDoc: nroDocLimpio,
        lineas: lineasRecepcion
          .filter((l) => l.cantidadRecibir > 0)
          .map((l) => ({
            isbn: l.isbn,
            cantidad: l.cantidadRecibir,
          })),
      });

      setMensajeExito(res.mensaje || "Recepción registrada exitosamente.");
      setOrdenParaRecibir(null);
      await cargarPendientes();
    } catch (err) {
      setErrorRecepcion(err.message || "Error al registrar la recepción.");
    } finally {
      setGuardandoRecepcion(false);
    }
  }

  // Roles
  const roleNormalizado = (usuario?.rol || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  const puedeRegistrar = ["administrador", "administradora", "admin", "comprador", "compradora"].includes(
    roleNormalizado
  );

  return (
    <ErpModuleShell
      module="compras"
      title="Recepción de Mercancía"
      description="Ingreso de libros recibidos a bodega, control de remisiones y actualización de stock."
      actions={
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="module-secondary-button"
            onClick={tabActiva === "pendientes" ? cargarPendientes : cargarHistorial}
            disabled={cargandoPendientes || cargandoHistorial}
          >
            Actualizar
          </button>
        </div>
      }
    >
      <div className="inventory-screen" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Pestañas de navegación */}
        <div className="module-tabs" style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--color-border)" }}>
          <button
            type="button"
            className={tabActiva === "pendientes" ? "is-selected" : ""}
            onClick={() => {
              setTabActiva("pendientes");
              setMensajeExito("");
            }}
          >
            Pendientes de recepción ({ordenesPendientes.length})
          </button>
          <button
            type="button"
            className={tabActiva === "historial" ? "is-selected" : ""}
            onClick={() => {
              setTabActiva("historial");
              setMensajeExito("");
            }}
          >
            Historial de recepciones
          </button>
        </div>

        {mensajeExito && (
          <div
            className="erp-card"
            style={{
              padding: "16px",
              backgroundColor: "var(--status-success-bg)",
              color: "var(--status-success-text)",
              border: "1px solid #c3e6cb",
              borderRadius: "8px",
            }}
          >
            ✓ <strong>{mensajeExito}</strong>
          </div>
        )}

        {/* PESTAÑA 1: PENDIENTES DE RECEPCIÓN */}
        {tabActiva === "pendientes" && (
          <>
            {errorPendientes && (
              <p className="ventas-message ventas-message-error" role="alert">
                {errorPendientes}
              </p>
            )}

            <section className="erp-card inventory-table-panel" style={{ padding: "20px" }}>
              <div style={{ marginBottom: "12px" }}>
                <p className="erp-eyebrow">ÓRDENES APROBADAS</p>
                <h2 style={{ margin: "4px 0", fontSize: "16px" }}>
                  Órdenes de Compra en espera de recepción
                </h2>
              </div>

              {cargandoPendientes ? (
                <p className="erp-empty" role="status">Cargando órdenes pendientes…</p>
              ) : (
                <>
                  <div className="module-table-scroll" role="region" aria-label="Tabla de órdenes pendientes" tabIndex={0}>
                    <table className="module-table" style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th scope="col" style={{ width: "90px", textAlign: "left" }}>N° OC</th>
                          <th scope="col" style={{ textAlign: "left" }}>Proveedor</th>
                          <th scope="col" style={{ width: "120px", textAlign: "left" }}>Fecha Emisión</th>
                          <th scope="col" style={{ width: "120px", textAlign: "left" }}>Fecha Entrega</th>
                          <th scope="col" style={{ textAlign: "left" }}>Libros / Pendientes</th>
                          <th scope="col" style={{ width: "130px", textAlign: "center" }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenesPendientes.map((oc) => {
                          const id = oc.idOc || oc.id_oc;
                          const prov = oc.proveedorNombre || oc.razon_social;
                          const entrega = oc.fechaEntrega || oc.fecha_entrega;
                          const lineasOc = oc.lineas || [];
                          const totalPendiente = lineasOc.reduce((sum, l) => sum + (l.cantidadPendiente || 0), 0);

                          return (
                            <tr key={id}>
                              <td style={{ fontFamily: "monospace", fontWeight: "bold" }}>#{id}</td>
                              <td><strong>{prov}</strong></td>
                              <td style={{ color: "var(--color-text-muted)" }}>{oc.fecha}</td>
                              <td style={{ color: "var(--color-text-muted)" }}>{entrega || "—"}</td>
                              <td>
                                <span style={{ fontSize: "12px", color: "var(--color-text-main)" }}>
                                  {lineasOc.length} títulos ({totalPendiente} un. pendientes)
                                </span>
                              </td>
                              <td style={{ textAlign: "center" }}>
                                {puedeRegistrar ? (
                                  <button
                                    type="button"
                                    className="module-primary-button"
                                    onClick={() => seleccionarOrdenParaRecibir(id)}
                                    disabled={cargandoOrden}
                                    style={{
                                      backgroundColor: "var(--color-primary)",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "6px",
                                      padding: "6px 12px",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Recibir
                                  </button>
                                ) : (
                                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                                    Solo lectura
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {ordenesPendientes.length === 0 && (
                    <p className="erp-empty" role="status" style={{ padding: "32px 0", textAlign: "center" }}>
                      No hay órdenes de compra pendientes de recepción en este momento.
                    </p>
                  )}
                </>
              )}
            </section>
          </>
        )}

        {/* PESTAÑA 2: HISTORIAL DE RECEPCIONES */}
        {tabActiva === "historial" && (
          <>
            {errorHistorial && (
              <p className="ventas-message ventas-message-error" role="alert">
                {errorHistorial}
              </p>
            )}

            {/* Filtros de Historial */}
            <section
              className="erp-card"
              style={{
                padding: "16px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <div>
                <label
                  htmlFor="hist-oc"
                  style={{ display: "block", fontSize: "11px", fontWeight: "600", marginBottom: "4px", color: "var(--color-text-muted)" }}
                >
                  FILTRAR POR N° OC
                </label>
                <label className="erp-search" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ErpIcon name="search" />
                  <input
                    id="hist-oc"
                    type="number"
                    placeholder="N° orden..."
                    value={filtroOc}
                    onChange={(e) => setFiltroOc(e.target.value)}
                    style={{ width: "100%", border: "none", outline: "none", background: "transparent" }}
                  />
                </label>
              </div>

              <div>
                <label
                  htmlFor="hist-prov"
                  style={{ display: "block", fontSize: "11px", fontWeight: "600", marginBottom: "4px", color: "var(--color-text-muted)" }}
                >
                  FILTRAR POR PROVEEDOR
                </label>
                <select
                  id="hist-prov"
                  value={filtroProveedor}
                  onChange={(e) => setFiltroProveedor(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "7px", border: "1px solid var(--color-border)" }}
                >
                  <option value="">Todos los proveedores</option>
                  {proveedores.map((p) => {
                    const id = p.idProveedor || p.id_proveedor;
                    const razon = p.razonSocial || p.razon_social;
                    return (
                      <option key={id} value={id}>
                        {razon}
                      </option>
                    );
                  })}
                </select>
              </div>
            </section>

            {/* Tabla Historial */}
            <section className="erp-card inventory-table-panel" style={{ padding: "20px" }}>
              {cargandoHistorial ? (
                <p className="erp-empty" role="status">Cargando historial de recepciones…</p>
              ) : (
                <>
                  <div className="module-table-scroll" role="region" aria-label="Tabla de historial" tabIndex={0}>
                    <table className="module-table" style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th scope="col" style={{ width: "140px", textAlign: "left" }}>Fecha / Hora</th>
                          <th scope="col" style={{ width: "80px", textAlign: "left" }}>N° OC</th>
                          <th scope="col" style={{ textAlign: "left" }}>Proveedor</th>
                          <th scope="col" style={{ width: "140px", textAlign: "left" }}>Tipo Doc.</th>
                          <th scope="col" style={{ width: "120px", textAlign: "left" }}>N° Documento</th>
                          <th scope="col" style={{ width: "130px", textAlign: "left" }}>Registrado Por</th>
                          <th scope="col" style={{ width: "90px", textAlign: "center" }}>Detalle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historial.map((rec) => {
                          const idRec = rec.idRecepcion || rec.id_recepcion;
                          const idOc = rec.idOc || rec.id_oc;
                          const prov = rec.proveedorNombre || rec.proveedor;
                          const tDoc = rec.tipoDoc || rec.tipo_doc;
                          const nDoc = rec.nroDoc || rec.nro_doc;
                          const usuarioNom = rec.usuarioNombre || rec.usuario;

                          return (
                            <tr
                              key={idRec}
                              onClick={() => setRecepcionSeleccionada(rec)}
                              style={{ cursor: "pointer" }}
                              title="Haz clic para ver las líneas de esta recepción"
                            >
                              <td style={{ color: "var(--color-text-muted)" }}>{rec.fecha}</td>
                              <td style={{ fontFamily: "monospace", fontWeight: "bold" }}>#{idOc}</td>
                              <td><strong>{prov}</strong></td>
                              <td style={{ textTransform: "capitalize" }}>{tDoc}</td>
                              <td style={{ fontFamily: "monospace" }}>{nDoc}</td>
                              <td>{usuarioNom}</td>
                              <td style={{ textAlign: "center" }}>
                                <button
                                  type="button"
                                  className="module-secondary-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRecepcionSeleccionada(rec);
                                  }}
                                  style={{ padding: "4px 8px", fontSize: "11px" }}
                                >
                                  Ver líneas
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {historial.length === 0 && (
                    <p className="erp-empty" role="status" style={{ padding: "32px 0", textAlign: "center" }}>
                      No hay recepciones registradas que coincidan con los filtros.
                    </p>
                  )}
                </>
              )}
            </section>
          </>
        )}

        {/* MODAL 1: FORMULARIO REGISTRAR RECEPCIÓN */}
        {ordenParaRecibir && (
          <div
            className="module-modal-backdrop"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
            onClick={cerrarModalRecepcion}
          >
            <div
              className="erp-card"
              style={{
                width: "100%",
                maxWidth: "780px",
                padding: "28px",
                borderRadius: "12px",
                backgroundColor: "var(--color-surface-card)",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--color-border)",
                  paddingBottom: "14px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <p className="erp-eyebrow">INGRESO A BODEGA</p>
                  <h2 style={{ margin: "4px 0 0", fontSize: "19px" }}>
                    Recepción de Mercancía · OC #{ordenParaRecibir.idOc || ordenParaRecibir.id_oc}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={cerrarModalRecepcion}
                  disabled={guardandoRecepcion}
                  style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "var(--color-text-muted)" }}
                  aria-label="Cerrar modal"
                >
                  ✕
                </button>
              </div>

              {errorRecepcion && (
                <p className="ventas-message ventas-message-error" role="alert" style={{ marginBottom: "16px" }}>
                  {errorRecepcion}
                </p>
              )}

              <form onSubmit={handleRegistrarRecepcion}>
                {/* Datos del Documento */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    backgroundColor: "var(--color-bg-app)",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <label
                      htmlFor="form-tipo-doc"
                      style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}
                    >
                      Tipo de Documento <span style={{ color: "var(--color-primary)" }}>*</span>
                    </label>
                    <select
                      id="form-tipo-doc"
                      value={tipoDoc}
                      onChange={(e) => setTipoDoc(e.target.value)}
                      disabled={guardandoRecepcion}
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <option value="guia de despacho">Guía de despacho</option>
                      <option value="factura">Factura</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="form-nro-doc"
                      style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}
                    >
                      Número de Documento <span style={{ color: "var(--color-primary)" }}>*</span>
                    </label>
                    <input
                      id="form-nro-doc"
                      type="text"
                      placeholder="Ej. GD-10203 o F-5001"
                      maxLength={50}
                      value={nroDoc}
                      onChange={(e) => setNroDoc(e.target.value)}
                      disabled={guardandoRecepcion}
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid var(--color-border)",
                      }}
                    />
                  </div>
                </div>

                {/* Tabla de líneas para recibir */}
                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "14px" }}>Líneas a Recepcionar</h3>
                    <button
                      type="button"
                      className="module-secondary-button"
                      onClick={recibirTodoLoPendiente}
                      disabled={guardandoRecepcion}
                      style={{ fontSize: "11px", padding: "4px 10px" }}
                    >
                      Recibir todo lo pendiente
                    </button>
                  </div>

                  <div className="module-table-scroll">
                    <table className="module-table" style={{ width: "100%", fontSize: "12px" }}>
                      <thead>
                        <tr>
                          <th scope="col" style={{ textAlign: "left" }}>Libro / Título</th>
                          <th scope="col" style={{ width: "110px", textAlign: "left" }}>ISBN</th>
                          <th scope="col" style={{ width: "70px", textAlign: "right" }}>Pedida</th>
                          <th scope="col" style={{ width: "80px", textAlign: "right" }}>Ya recib.</th>
                          <th scope="col" style={{ width: "80px", textAlign: "right" }}>Pendiente</th>
                          <th scope="col" style={{ width: "110px", textAlign: "right" }}>Recibir ahora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineasRecepcion.map((l) => (
                          <tr key={l.isbn}>
                            <td><strong>{l.titulo}</strong></td>
                            <td style={{ fontFamily: "monospace" }}>{l.isbn}</td>
                            <td style={{ textAlign: "right" }}>{l.cantidadPedida}</td>
                            <td style={{ textAlign: "right", color: "var(--color-text-muted)" }}>{l.cantidadRecibida}</td>
                            <td style={{ textAlign: "right", fontWeight: "600", color: l.cantidadPendiente > 0 ? "var(--color-primary)" : "green" }}>
                              {l.cantidadPendiente}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <input
                                type="number"
                                min="0"
                                max={l.cantidadPendiente}
                                value={l.cantidadRecibir}
                                onChange={(e) => cambiarCantidadRecibir(l.isbn, e.target.value)}
                                disabled={guardandoRecepcion || l.cantidadPendiente <= 0}
                                style={{
                                  width: "80px",
                                  padding: "6px",
                                  borderRadius: "6px",
                                  border: "1px solid var(--color-border)",
                                  textAlign: "right",
                                  fontWeight: "bold",
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Botones de acción */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "16px",
                  }}
                >
                  <button
                    type="button"
                    className="module-secondary-button"
                    onClick={cerrarModalRecepcion}
                    disabled={guardandoRecepcion}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="module-primary-button"
                    disabled={guardandoRecepcion}
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "7px",
                      padding: "9px 24px",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: guardandoRecepcion ? "not-allowed" : "pointer",
                      opacity: guardandoRecepcion ? 0.7 : 1,
                    }}
                  >
                    {guardandoRecepcion ? "Registrando ingreso…" : "Registrar recepción"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: DETALLE DE RECEPCIÓN HISTÓRICA */}
        {recepcionSeleccionada && (
          <div
            className="module-modal-backdrop"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
            onClick={() => setRecepcionSeleccionada(null)}
          >
            <div
              className="erp-card"
              style={{
                width: "100%",
                maxWidth: "600px",
                padding: "24px",
                borderRadius: "12px",
                backgroundColor: "var(--color-surface-card)",
                maxHeight: "85vh",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--color-border)",
                  paddingBottom: "12px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <p className="erp-eyebrow">COMPROBANTE DE RECEPCIÓN</p>
                  <h2 style={{ margin: "2px 0 0", fontSize: "18px" }}>
                    Recepción #{recepcionSeleccionada.idRecepcion || recepcionSeleccionada.id_recepcion}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setRecepcionSeleccionada(null)}
                  style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--color-text-muted)" }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  backgroundColor: "var(--color-bg-app)",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                <div>
                  <span style={{ color: "var(--color-text-muted)", display: "block" }}>Orden de Compra:</span>
                  <strong>#{recepcionSeleccionada.idOc || recepcionSeleccionada.id_oc}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--color-text-muted)", display: "block" }}>Proveedor:</span>
                  <strong>{recepcionSeleccionada.proveedorNombre || recepcionSeleccionada.proveedor}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--color-text-muted)", display: "block" }}>Documento:</span>
                  <strong style={{ textTransform: "capitalize" }}>
                    {recepcionSeleccionada.tipoDoc || recepcionSeleccionada.tipo_doc} #{recepcionSeleccionada.nroDoc || recepcionSeleccionada.nro_doc}
                  </strong>
                </div>
                <div>
                  <span style={{ color: "var(--color-text-muted)", display: "block" }}>Fecha de Recepción:</span>
                  <strong>{recepcionSeleccionada.fecha}</strong>
                </div>
              </div>

              <h4 style={{ margin: "0 0 10px", fontSize: "13px" }}>Libros Ingresados</h4>
              <div className="module-table-scroll" style={{ marginBottom: "16px" }}>
                <table className="module-table" style={{ width: "100%", fontSize: "12px" }}>
                  <thead>
                    <tr>
                      <th scope="col" style={{ textAlign: "left" }}>Título</th>
                      <th scope="col" style={{ width: "120px", textAlign: "left" }}>ISBN</th>
                      <th scope="col" style={{ width: "100px", textAlign: "right" }}>Cant. Ingresada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recepcionSeleccionada.lineas || []).map((l, i) => (
                      <tr key={i}>
                        <td><strong>{l.titulo}</strong></td>
                        <td style={{ fontFamily: "monospace" }}>{l.isbn}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>+{l.cantidad} un.</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="module-secondary-button"
                  onClick={() => setRecepcionSeleccionada(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErpModuleShell>
  );
}
