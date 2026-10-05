"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ErpIcon from "@/components/ErpIcon";
import "./erp.css";

const books = [
  {
    title: "El Principito",
    author: "Antoine de Saint-Exupéry",
    sales: 128,
    cover: "sage",
  },
  { title: "1984", author: "George Orwell", sales: 104, cover: "clay" },
  {
    title: "Cien años de soledad",
    author: "Gabriel García Márquez",
    sales: 97,
    cover: "sand",
  },
  { title: "El Hobbit", author: "J. R. R. Tolkien", sales: 76, cover: "rose" },
];

const metrics = [
  {
    title: "Ventas del día",
    value: "$1.250.000",
    detail: "+12,5 % respecto a ayer",
    icon: "sales",
    tone: "success",
  },
  {
    title: "Stock crítico",
    value: "24 títulos",
    detail: "Requieren reposición",
    icon: "inventory",
    tone: "danger",
  },
  {
    title: "Cuentas por pagar",
    value: "$850.000",
    detail: "Próximos vencimientos",
    icon: "accounting",
    tone: "warning",
  },
  {
    title: "Recepciones pendientes",
    value: "7",
    detail: "Por revisar y validar",
    icon: "purchases",
    tone: "neutral",
  },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Estado para guardar el nombre y las iniciales del usuario conectado
  const [nombreUsuario, setNombreUsuario] = useState("Administrador");
  const [iniciales, setIniciales] = useState("AD");

  useEffect(() => {
    // Leemos el nombre guardado en el navegador tras hacer login
    const guardado = localStorage.getItem("nombre_usuario");
    if (guardado) {
      setNombreUsuario(guardado);
      
      // Generamos las iniciales automáticamente (Ej: "Administrador General" -> "AG")
      const partes = guardado.split(" ");
      if (partes.length >= 2) {
        setIniciales((partes[0][0] + partes[1][0]).toUpperCase());
      } else {
        setIniciales(guardado.substring(0, 2).toUpperCase());
      }
    }
  }, []);

  const visibleBooks = books.filter((book) =>
    `${book.title} ${book.author}`
      .toLocaleLowerCase("es")
      .includes(search.toLocaleLowerCase("es").trim()),
  );

  return (
    <div className="erp-screen erp-home" lang="es">
      <a className="erp-skip" href="#main-content">
        Saltar al contenido
      </a>
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
          <Link href="/" className="erp-nav-item is-active" aria-current="page">
            <ErpIcon name="home" />
            Inicio
          </Link>
          <p className="erp-nav-label">GESTIÓN</p>
          {[
            ["purchases", "Compras"],
            ["sales", "Ventas"],
            ["inventory", "Inventario"],
            ["accounting", "Contabilidad"],
          ].map(([icon, label]) => (
            <button
              key={label}
              className="erp-nav-item"
              disabled
              title="Módulo pendiente de implementación"
            >
              <ErpIcon name={icon} />
              {label}
              <span className="erp-nav-arrow">›</span>
            </button>
          ))}
          <p className="erp-nav-label">SISTEMA</p>
          <button
            className="erp-nav-item"
            disabled
            title="Módulo pendiente de implementación"
          >
            <ErpIcon name="settings" />
            Administración
          </button>
        </nav>
        <div className="erp-sidebar-note">
          <span className="erp-dot" />
          Todo en un mismo lugar<p>Una nueva página para tu librería.</p>
        </div>
        
        {/* SECCIÓN USUARIO SIDEBAR (Dinámica) */}
        <div className="erp-sidebar-user">
          <span className="erp-avatar">{iniciales}</span>
          <div>
            <strong>{nombreUsuario}</strong>
            <small>Sesión activa</small>
          </div>
          <Link
            href="/login"
            aria-label="Volver al login"
            title="Volver al login"
          >
            <ErpIcon name="logout" />
          </Link>
        </div>
      </aside>

      <div className="erp-workspace">
        <header className="erp-topbar">
          <div className="erp-branch">
            <span className="erp-muted">Sucursal</span>
            <strong>Casa Matriz</strong>
          </div>
          <span className="erp-demo-badge">Modo demo</span>
          <div className="erp-topbar-actions">
            <div className="erp-notifications">
              <button
                className="erp-icon-button"
                aria-label="Notificaciones"
                aria-expanded={notificationsOpen}
                aria-controls="erp-notifications"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <ErpIcon name="bell" />
                <span className="erp-notification-dot" />
              </button>
              {notificationsOpen && (
                <div className="erp-notification-panel" id="erp-notifications">
                  <strong>Notificaciones de ejemplo</strong>
                  <p>
                    <span className="erp-status danger">Inventario</span>24
                    títulos requieren reposición.
                  </p>
                  <p>
                    <span className="erp-status warning">Compras</span>2 órdenes
                    esperan aprobación.
                  </p>
                </div>
              )}
            </div>

            {/* SECCIÓN PERFIL TOPBAR (Dinámica) */}
            <Link href="/login" className="erp-topbar-profile">
              <span className="erp-avatar">{iniciales}</span>
              <span>
                {nombreUsuario}<small>Cerrar sesión</small>
              </span>
            </Link>

            <button
              className="erp-icon-button erp-mobile-menu"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              aria-controls="erp-mobile-nav"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <ErpIcon name="menu" />
            </button>
          </div>
        </header>

        {menuOpen && (
          <nav
            id="erp-mobile-nav"
            className="erp-mobile-nav"
            aria-label="Navegación móvil"
          >
            <Link href="/">Inicio</Link>
            <span>
              Compras · Ventas · Inventario · Contabilidad (próximamente)
            </span>
            <Link href="/login">Volver al login</Link>
          </nav>
        )}

        <main id="main-content" className="erp-main">
          <div className="erp-page-heading">
            <div>
              <p className="erp-eyebrow">TU LIBRERÍA, DE UN VISTAZO</p>
              <h1>Bienvenido, {nombreUsuario}</h1>
              <p className="erp-muted">
                Un resumen para comenzar el día con todo en orden.
              </p>
            </div>
            <span className="erp-date">
              <ErpIcon name="calendar" />4 de octubre de 2026
              <small>Fecha de la demostración</small>
            </span>
          </div>

          <div className="erp-demo-note">
            <ErpIcon name="info" />
            <span>
              Vista previa del sistema. Los indicadores y registros son datos de
              demostración.
            </span>
          </div>

          <section
            className="erp-metrics"
            aria-label="Indicadores de la librería"
          >
            {metrics.map((metric) => (
              <article key={metric.title} className="erp-card erp-metric">
                <div className="erp-metric-heading">
                  <h2>{metric.title}</h2>
                  <span className={`erp-metric-icon ${metric.tone}`}>
                    <ErpIcon name={metric.icon} />
                  </span>
                </div>
                <strong className="erp-metric-value">{metric.value}</strong>
                <p className={`erp-metric-detail ${metric.tone}`}>
                  {metric.tone === "success" && <ErpIcon name="trend" />}
                  {metric.detail}
                </p>
              </article>
            ))}
          </section>

          <div className="erp-overview-grid">
            <section className="erp-card erp-sales-panel">
              <div className="erp-section-heading">
                <div>
                  <p className="erp-eyebrow">EL PULSO DE TU NEGOCIO</p>
                  <h2>Ventas de la semana</h2>
                </div>
                <span className="erp-period">Últimos 7 días</span>
              </div>
              <div className="erp-chart-total">
                <strong>$7.840.000</strong>
                <span className="erp-status success">↗ 8,2 %</span>
                <span className="erp-muted">vs. semana anterior</span>
              </div>
              <div
                className="erp-chart"
                role="img"
                aria-label="Ventas de ejemplo..."
              >
                <div className="erp-chart-scale">
                  <span>$1,5 M</span>
                  <span>$1 M</span>
                  <span>$0,5 M</span>
                  <span>$0</span>
                </div>
                <div className="erp-chart-plot">
                  <div className="erp-chart-grid" />
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
                    (day, index) => (
                      <div className="erp-chart-column" key={day}>
                        <div className={`erp-bar erp-bar-${index + 1}`} />
                        <span>{day}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div className="erp-chart-legend">
                <span className="erp-dot" />
                Ventas totales en pesos chilenos
              </div>
            </section>

            <section className="erp-card erp-orders-panel">
              <div className="erp-section-heading">
                <div>
                  <p className="erp-eyebrow">POR REVISAR</p>
                  <h2>Órdenes pendientes</h2>
                </div>
                <span className="erp-count">2</span>
              </div>
              <p className="erp-muted erp-section-description">
                Compras que esperan aprobación.
              </p>
              {[
                ["OC-00124", "Editorial Planeta", "$485.000"],
                ["OC-00125", "Editorial SM", "$320.000"],
              ].map(([code, supplier, amount]) => (
                <article key={code} className="erp-order">
                  <div>
                    <strong>{code}</strong>
                    <span className="erp-status warning">Pendiente</span>
                  </div>
                  <p className="erp-muted">{supplier}</p>
                  <strong className="erp-order-amount">{amount}</strong>
                </article>
              ))}
              <p className="erp-panel-footnote">
                <ErpIcon name="info" />
                La gestión de compras estará disponible próximamente.
              </p>
            </section>
          </div>

          <div className="erp-details-grid">
            <section className="erp-card erp-books-panel">
              <div className="erp-section-heading">
                <div>
                  <p className="erp-eyebrow">HISTORIAS QUE SE MUEVEN</p>
                  <h2>Libros más vendidos</h2>
                </div>
                <span className="erp-period">Este mes</span>
              </div>
              <label className="erp-search">
                <ErpIcon name="search" />
                <input
                  type="search"
                  aria-label="Buscar por título o autor"
                  placeholder="Buscar por título o autor…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <ul className="erp-book-list">
                {visibleBooks.map((book) => (
                  <li key={book.title}>
                    <span
                      className={`erp-book-cover ${book.cover}`}
                      aria-hidden="true"
                    >
                      <ErpIcon name="book" />
                    </span>
                    <div>
                      <strong>{book.title}</strong>
                      <span>{book.author}</span>
                    </div>
                    <span className="erp-book-sales">
                      <strong>{book.sales}</strong> ventas
                    </span>
                  </li>
                ))}
              </ul>
              {visibleBooks.length === 0 && (
                <p className="erp-empty" role="status">
                  No hay libros que coincidan con tu búsqueda.
                </p>
              )}
            </section>

            <section className="erp-card erp-activity-panel">
              <div className="erp-section-heading">
                <div>
                  <p className="erp-eyebrow">LO ÚLTIMO EN TU LIBRERÍA</p>
                  <h2>Actividad reciente</h2>
                </div>
                <ErpIcon name="clock" />
              </div>
              <ol className="erp-activity-list">
                {[
                  ["sales", "Venta registrada", "Boleta #B-002341", "Hace 5 minutos"],
                  ["inventory", "Stock actualizado", "El Principito · +20 unidades", "Hace 18 minutos"],
                  ["purchases", "Recepción registrada", "Editorial Planeta", "Hace 32 minutos"],
                  ["accounting", "Orden aprobada", "OC-00120", "Hace 1 hora"],
                ].map(([icon, title, detail, time]) => (
                  <li key={title}>
                    <span className="erp-activity-icon">
                      <ErpIcon name={icon} />
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <p>{detail}</p>
                      <small>{time}</small>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <footer className="erp-footer">
            <span>Librería ERP</span>
            <span>Compras · Ventas · Inventario · Contabilidad</span>
          </footer>
        </main>
      </div>
    </div>
  );
}