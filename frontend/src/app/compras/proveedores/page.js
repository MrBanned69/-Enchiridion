"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ErpModuleShell from "@/components/ErpModuleShell";
import ErpIcon from "@/components/ErpIcon";
import {
  fetchProveedores,
  crearProveedor,
  editarProveedor,
} from "@/lib/compras-api";

function validarRutChileno(rutInput) {
  if (!rutInput || typeof rutInput !== "string" || !rutInput.trim()) {
    return { valido: false, error: "El RUT es obligatorio." };
  }

  const clean = rutInput.trim().replace(/\./g, "").replace(/-/g, "").toUpperCase();
  if (clean.length < 7 || clean.length > 9) {
    return {
      valido: false,
      error: "El RUT debe contener entre 6 y 8 dígitos más el dígito verificador.",
    };
  }

  const cuerpo = clean.slice(0, -1);
  const dv = clean.slice(-1);

  if (!/^\d+$/.test(cuerpo) || parseInt(cuerpo, 10) <= 0) {
    return { valido: false, error: "El cuerpo del RUT debe ser numérico." };
  }

  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  let dvEsperado = "0";
  if (resto === 11) dvEsperado = "0";
  else if (resto === 10) dvEsperado = "K";
  else dvEsperado = String(resto);

  if (dv !== dvEsperado) {
    return {
      valido: false,
      error: `El dígito verificador del RUT no es válido (esperado: ${dvEsperado}).`,
    };
  }

  const numero = parseInt(cuerpo, 10);
  const formatted = numero.toLocaleString("es-CL") + "-" + dvEsperado;

  return { valido: true, formatted };
}

export default function ProveedoresPage() {
  const { usuario, loading: authLoading, error: authError } = useAuth();
  const router = useRouter();

  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);

  const [formRut, setFormRut] = useState("");
  const [formRazonSocial, setFormRazonSocial] = useState("");
  const [formContacto, setFormContacto] = useState("");
  const [formCondicionPago, setFormCondicionPago] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!authLoading && !usuario && !authError) {
      router.replace("/login");
    }
  }, [authLoading, usuario, authError, router]);

  const cargarProveedores = useCallback(async (termino = "") => {
    setCargando(true);
    setErrorGeneral("");
    try {
      const datos = await fetchProveedores(termino);
      setProveedores(datos);
    } catch (err) {
      setErrorGeneral(err.message || "No se pudieron consultar los proveedores.");
      setProveedores([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!usuario) return;
    const timer = setTimeout(() => {
      cargarProveedores(busqueda);
    }, 300);
    return () => clearTimeout(timer);
  }, [usuario, busqueda, cargarProveedores]);

  function abrirModalNuevo() {
    setProveedorEditando(null);
    setFormRut("");
    setFormRazonSocial("");
    setFormContacto("");
    setFormCondicionPago("");
    setFormError("");
    setModalAbierto(true);
  }

  function abrirModalEditar(prov) {
    setProveedorEditando(prov);
    setFormRut(prov.rut || "");
    setFormRazonSocial(prov.razonSocial || prov.razon_social || "");
    setFormContacto(prov.contacto || "");
    setFormCondicionPago(prov.condicionPago || prov.condicion_pago || "");
    setFormError("");
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;
    setModalAbierto(false);
    setProveedorEditando(null);
    setFormError("");
  }

  async function handleGuardar(event) {
    event.preventDefault();
    setFormError("");

    const rutLimpio = formRut.trim();
    const razonLimpia = formRazonSocial.trim();
    const contactoLimpio = formContacto.trim();
    const condicionLimpia = formCondicionPago.trim();

    if (!rutLimpio) {
      setFormError("El RUT es obligatorio.");
      return;
    }

    if (!razonLimpia) {
      setFormError("La razón social es obligatoria.");
      return;
    }

    const checkRut = validarRutChileno(rutLimpio);
    if (!checkRut.valido) {
      setFormError(checkRut.error);
      return;
    }

    if (checkRut.formatted.length > 15) {
      setFormError("El RUT supera el largo máximo permitido (15 caracteres).");
      return;
    }

    if (razonLimpia.length > 150) {
      setFormError("La razón social no puede superar 150 caracteres.");
      return;
    }

    if (contactoLimpio.length > 150) {
      setFormError("El contacto no puede superar 150 caracteres.");
      return;
    }

    if (condicionLimpia.length > 80) {
      setFormError("La condición de pago no puede superar 80 caracteres.");
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        rut: checkRut.formatted,
        razonSocial: razonLimpia,
        contacto: contactoLimpio || null,
        condicionPago: condicionLimpia || null,
      };

      if (proveedorEditando) {
        const id = proveedorEditando.idProveedor || proveedorEditando.id_proveedor;
        await editarProveedor(id, payload);
      } else {
        await crearProveedor(payload);
      }

      setModalAbierto(false);
      await cargarProveedores(busqueda);
    } catch (err) {
      setFormError(err.message || "Error al guardar el proveedor.");
    } finally {
      setGuardando(false);
    }
  }

  const roleNormalizado = (usuario?.rol || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  const tienePermiso = [
    "administrador",
    "administradora",
    "admin",
    "comprador",
    "compradora",
  ].includes(roleNormalizado);

  return (
    <ErpModuleShell
      module="compras"
      title="Gestión de Proveedores"
      description="Consulta, registra y actualiza los proveedores del ERP de Librería."
      actions={
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="module-secondary-button"
            onClick={() => cargarProveedores(busqueda)}
            disabled={cargando}
          >
            Actualizar
          </button>
          {tienePermiso && (
            <button
              type="button"
              className="module-primary-button"
              onClick={abrirModalNuevo}
              style={{
                backgroundColor: "var(--color-primary)",
                color: "#ffffff",
                border: "none",
                borderRadius: "7px",
                padding: "8px 16px",
                fontWeight: "600",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              + Nuevo proveedor
            </button>
          )}
        </div>
      }
    >
      <div className="inventory-screen" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {errorGeneral && (
          <p className="ventas-message ventas-message-error" role="alert">
            {errorGeneral}
          </p>
        )}

        {!tienePermiso && usuario && (
          <div
            className="erp-card"
            style={{
              padding: "16px",
              backgroundColor: "var(--status-warning-bg)",
              color: "var(--status-warning-text)",
              border: "1px solid var(--color-border)",
            }}
          >
            <strong>Aviso de permisos:</strong> Tu rol actual (
            {usuario.rol}) solo dispone de permisos de lectura o no tiene acceso
            de edición en este módulo.
          </div>
        )}

        {/* Buscador */}
        <section
          className="erp-card inventory-search-panel"
          aria-label="Buscar proveedores"
          style={{ padding: "16px" }}
        >
          <label className="erp-search" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ErpIcon name="search" />
            <input
              type="search"
              aria-label="Buscar proveedores por RUT o razón social"
              placeholder="Buscar por RUT o razón social…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
              }}
            />
          </label>
        </section>

        {/* Tabla de proveedores */}
        <section className="erp-card inventory-table-panel" style={{ padding: "20px" }}>
          {cargando ? (
            <p className="erp-empty" role="status">
              Cargando proveedores…
            </p>
          ) : (
            <>
              <div
                className="module-table-scroll"
                role="region"
                aria-label="Tabla de proveedores"
                tabIndex={0}
              >
                <table className="module-table inventory-table" style={{ width: "100%" }}>
                  <caption className="module-visually-hidden">
                    Listado de proveedores registrados
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ textAlign: "left", width: "140px" }}>
                        RUT
                      </th>
                      <th scope="col" style={{ textAlign: "left" }}>
                        Razón Social
                      </th>
                      <th scope="col" style={{ textAlign: "left" }}>
                        Contacto
                      </th>
                      <th scope="col" style={{ textAlign: "left" }}>
                        Condición de Pago
                      </th>
                      <th
                        scope="col"
                        style={{ textAlign: "center", width: "100px" }}
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.map((prov) => {
                      const id = prov.idProveedor || prov.id_proveedor;
                      const razon = prov.razonSocial || prov.razon_social;
                      const condicion = prov.condicionPago || prov.condicion_pago;

                      return (
                        <tr key={id}>
                          <td style={{ fontFamily: "monospace", fontSize: "13px" }}>
                            <strong>{prov.rut}</strong>
                          </td>
                          <td>
                            <strong>{razon}</strong>
                          </td>
                          <td style={{ color: "var(--color-text-muted)" }}>
                            {prov.contacto || "—"}
                          </td>
                          <td>
                            <span className="erp-status neutral">
                              {condicion || "Contado"}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {tienePermiso ? (
                              <button
                                type="button"
                                className="module-secondary-button"
                                onClick={() => abrirModalEditar(prov)}
                                style={{
                                  fontSize: "12px",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                }}
                              >
                                Editar
                              </button>
                            ) : (
                              <span style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>
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

              {proveedores.length === 0 && !cargando && (
                <p className="erp-empty" role="status" style={{ padding: "32px 0", textAlign: "center" }}>
                  {busqueda
                    ? `No se encontraron proveedores que coincidan con "${busqueda}".`
                    : "No hay proveedores registrados actualmente."}
                </p>
              )}
            </>
          )}
        </section>

        {/* Modal / Panel de Formulario */}
        {modalAbierto && (
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
            onClick={cerrarModal}
          >
            <div
              className="erp-card"
              style={{
                width: "100%",
                maxWidth: "520px",
                padding: "28px",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                backgroundColor: "var(--color-surface-card)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  borderBottom: "1px solid var(--color-border)",
                  paddingBottom: "12px",
                }}
              >
                <div>
                  <p className="erp-eyebrow" style={{ margin: 0 }}>
                    COMPRAS Y PROVEEDORES
                  </p>
                  <h2 style={{ margin: "4px 0 0", fontSize: "18px" }}>
                    {proveedorEditando ? "Editar Proveedor" : "Nuevo Proveedor"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: "var(--color-text-muted)",
                  }}
                  aria-label="Cerrar modal"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <p
                  className="ventas-message ventas-message-error"
                  role="alert"
                  style={{ marginBottom: "16px" }}
                >
                  {formError}
                </p>
              )}

              <form onSubmit={handleGuardar}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label
                      htmlFor="input-rut"
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        marginBottom: "6px",
                        color: "var(--color-text-main)",
                      }}
                    >
                      RUT <span style={{ color: "var(--color-primary)" }}>*</span>
                    </label>
                    <input
                      id="input-rut"
                      type="text"
                      placeholder="Ej. 76.111.116-7 o 761111167"
                      maxLength={15}
                      value={formRut}
                      onChange={(e) => setFormRut(e.target.value)}
                      disabled={guardando}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "7px",
                        border: "1px solid var(--color-border)",
                        fontSize: "13px",
                      }}
                    />
                    <small style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>
                      Se validará con Módulo 11 y se formateará automáticamente.
                    </small>
                  </div>

                  <div>
                    <label
                      htmlFor="input-razon"
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        marginBottom: "6px",
                        color: "var(--color-text-main)",
                      }}
                    >
                      Razón Social{" "}
                      <span style={{ color: "var(--color-primary)" }}>*</span>
                    </label>
                    <input
                      id="input-razon"
                      type="text"
                      placeholder="Ej. Distribuidora Andina SpA"
                      maxLength={150}
                      value={formRazonSocial}
                      onChange={(e) => setFormRazonSocial(e.target.value)}
                      disabled={guardando}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "7px",
                        border: "1px solid var(--color-border)",
                        fontSize: "13px",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="input-contacto"
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        marginBottom: "6px",
                        color: "var(--color-text-main)",
                      }}
                    >
                      Contacto (Opcional)
                    </label>
                    <input
                      id="input-contacto"
                      type="text"
                      placeholder="Correo o teléfono de contacto"
                      maxLength={150}
                      value={formContacto}
                      onChange={(e) => setFormContacto(e.target.value)}
                      disabled={guardando}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "7px",
                        border: "1px solid var(--color-border)",
                        fontSize: "13px",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="input-condicion"
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        marginBottom: "6px",
                        color: "var(--color-text-main)",
                      }}
                    >
                      Condición de Pago (Opcional)
                    </label>
                    <input
                      id="input-condicion"
                      type="text"
                      placeholder="Ej. 30 dias, Contado, 60 dias"
                      maxLength={80}
                      value={formCondicionPago}
                      onChange={(e) => setFormCondicionPago(e.target.value)}
                      disabled={guardando}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "7px",
                        border: "1px solid var(--color-border)",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    marginTop: "24px",
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "16px",
                  }}
                >
                  <button
                    type="button"
                    className="module-secondary-button"
                    onClick={cerrarModal}
                    disabled={guardando}
                    style={{ padding: "8px 16px" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="module-primary-button"
                    disabled={guardando}
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "7px",
                      padding: "8px 20px",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: guardando ? "not-allowed" : "pointer",
                      opacity: guardando ? 0.7 : 1,
                    }}
                  >
                    {guardando
                      ? "Guardando…"
                      : proveedorEditando
                      ? "Guardar cambios"
                      : "Crear proveedor"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ErpModuleShell>
  );
}
