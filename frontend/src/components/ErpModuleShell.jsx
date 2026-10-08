"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ErpIcon from "@/components/ErpIcon";
import { canOpenModule } from "@/lib/module-access";
import "@/app/erp.css";
import "@/app/modules.css";

export default function ErpModuleShell({
  module,
  title,
  description,
  children,
  actions,
  subnav,
  liveData = false,
  dataLabel = liveData ? "Datos del sistema" : "Datos de prueba",
}) {
  const router = useRouter();
  const { usuario, iniciales, loading, error, logout, refreshSession } =
    useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    if (!loading && !usuario && !error) router.replace("/login");
  }, [loading, usuario, error, router]);

  async function handleLogout() {
    if (closing) return;
    setClosing(true);
    setLogoutError("");
    try {
      await logout();
      router.replace("/login");
    } catch {
      setLogoutError("No se pudo cerrar sesión. Intenta nuevamente.");
    } finally {
      setClosing(false);
    }
  }

  if (loading || !usuario || error) {
    return (
      <main className="erp-screen erp-auth-state" lang="es">
        <p role="status">{error || "Comprobando tu sesión…"}</p>
        {error && (
          <>
            <button className="erp-primary-button" onClick={refreshSession}>
              Reintentar
            </button>
            <Link href="/login">Volver al login</Link>
          </>
        )}
      </main>
    );
  }
  if (!canOpenModule(usuario, module)) {
    return (
      <main className="erp-screen erp-auth-state" lang="es">
        <ErpIcon name="lock" />
        <h1>Acceso no disponible</h1>
        <p>Tu perfil no tiene acceso a este módulo.</p>
        <Link href="/">Volver al inicio</Link>
      </main>
    );
  }

function navigation() {
  return (
    <>
      <p className="erp-nav-label">PRINCIPAL</p>

      <Link href="/" className="erp-nav-item">
        <ErpIcon name="home" />
        Inicio
      </Link>

      <p className="erp-nav-label">GESTIÓN</p>

      {canOpenModule(usuario, "compras") && (
        <Link
          href="/compras"
          className={`erp-nav-item ${module === "compras" ? "is-active" : ""}`}
          aria-current={module === "compras" ? "page" : undefined}
        >
          <ErpIcon name="purchases" />
          Compras
          <span className="erp-nav-arrow">›</span>
        </Link>
      )}

      {canOpenModule(usuario, "ventas") && (
        <Link
          href="/ventas"
          className={`erp-nav-item ${
            module === "ventas" ? "is-active" : ""
          }`}
          aria-current={module === "ventas" ? "page" : undefined}
        >
          <ErpIcon name="sales" />
          Ventas
          <span className="erp-nav-arrow">›</span>
        </Link>
      )}

      {canOpenModule(usuario, "inventario") && (
        <Link
          href="/Inventario"
          className={`erp-nav-item ${module === "inventario" ? "is-active" : ""}`}
          aria-current={module === "inventario" ? "page" : undefined}
        >
          <ErpIcon name="inventory" />
          Inventario
          <span className="erp-nav-arrow" aria-hidden="true">›</span>
        </Link>
      )}

      {canOpenModule(usuario, "contabilidad") && (
        <Link
          href="/contabilidad"
          className={`erp-nav-item ${
            module === "contabilidad" ? "is-active" : ""
          }`}
          aria-current={module === "contabilidad" ? "page" : undefined}
        >
          <ErpIcon name="accounting" />
          Contabilidad
          <span className="erp-nav-arrow" aria-hidden="true">›</span>
        </Link>
      )}

      <p className="erp-nav-label">SISTEMA</p>

      {canOpenModule(usuario, "administracion") && (
        <Link
          href="/administracion"
          className={`erp-nav-item ${
            module === "administracion" ? "is-active" : ""
          }`}
          aria-current={module === "administracion" ? "page" : undefined}
        >
          <ErpIcon name="settings" />
          Administración y seguridad
          <span className="erp-nav-arrow" aria-hidden="true">›</span>
        </Link>
      )}
    </>
  );
}

  return (
    <div className="erp-screen erp-home erp-module-screen" lang="es">
      <a className="erp-skip" href="#module-content">
        Saltar al contenido
      </a>
      <aside className="erp-sidebar">
        <Link href="/" className="erp-brand">
          <span className="erp-brand-icon">
            <ErpIcon name="book" />
          </span>
          <span>
            Librería <b>ERP</b>
            <small>SISTEMA DE GESTIÓN</small>
          </span>
        </Link>
        <nav aria-label="Navegación principal">{navigation()}</nav>
        <div className="erp-sidebar-note">
          <span className="erp-dot" />
          Todo en un mismo lugar<p>Una nueva página para tu librería.</p>
        </div>
        <div className="erp-sidebar-user">
          <span className="erp-avatar">{iniciales}</span>
          <div>
            <strong>{usuario.nombre}</strong>
            <small>{usuario.rol}</small>
          </div>
          <button
            className="erp-logout-button"
            onClick={handleLogout}
            disabled={closing}
            aria-label="Cerrar sesión"
          >
            <ErpIcon name="logout" />
          </button>
        </div>
      </aside>
      <div className="erp-workspace">
        <header className="erp-topbar">
          <div className="erp-branch">
            <span className="erp-muted">Sucursal</span>
            <strong>Casa Matriz</strong>
          </div>
          <span className="erp-demo-badge">{dataLabel}</span>
          <div className="erp-topbar-actions">
            <button
              className="erp-topbar-profile erp-profile-button"
              onClick={handleLogout}
              disabled={closing}
              title={usuario.rol}
            >
              <span className="erp-avatar">{iniciales}</span>
              <span>
                {usuario.nombre}
                <small>{closing ? "Cerrando…" : "Cerrar sesión"}</small>
              </span>
            </button>
            <button
              className="erp-icon-button erp-mobile-menu"
              aria-label="Menú de módulos"
              aria-expanded={mobileOpen}
              aria-controls="module-mobile-menu"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <ErpIcon name="menu" />
            </button>
          </div>
        </header>
        {mobileOpen && (
          <nav
            className="erp-mobile-nav"
            id="module-mobile-menu"
            aria-label="Navegación móvil"
          >
            {navigation()}
          </nav>
        )}
        <main className="erp-main" id="module-content">
          {logoutError && (
            <p className="erp-login-message" role="alert">
              {logoutError}
            </p>
          )}
          <p className="module-breadcrumb">
            <Link href="/">Inicio</Link>
            <span> / </span>
            {title}
          </p>
          <div className="erp-page-heading">
            <div>
              <p className="erp-eyebrow">MÓDULO DE GESTIÓN</p>
              <h1>{title}</h1>
              <p className="erp-muted">{description}</p>
            </div>
            {actions}
          </div>

          {subnav}

          {!liveData && <div className="erp-demo-note">
            <ErpIcon name="info" />
            <span>
              Vista de consulta con datos de prueba. Los registros mostrados no
              modifican la sesión ni las operaciones del sistema.
            </span>
          </div>}
          {children}
          <footer className="erp-footer">
            <span>Librería ERP</span>
            <span>{title} · {dataLabel}</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
