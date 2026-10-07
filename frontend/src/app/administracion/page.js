"use client";

import { useState } from "react";
import ErpModuleShell from "@/components/ErpModuleShell";
import ErpIcon from "@/components/ErpIcon";
import {
  demoUsers,
  roles,
  dateLabel,
  normalize,
  downloadCsv,
} from "@/lib/module-demo";

export default function Administracion() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const visibleUsers = demoUsers.filter(
    (user) =>
      normalize(`${user.name} ${user.email}`).includes(normalize(search)) &&
      (role === "Todos" || user.role === role) &&
      (status === "Todos" || user.status === status),
  );
  const activeUsers = demoUsers.filter(
    (user) => user.status === "Activo",
  ).length;

  function exportUsers() {
    downloadCsv("usuarios-prueba.csv", [
      ["Nombre", "Correo", "Perfil", "Estado", "Fecha de creación"],
      ...visibleUsers.map((user) => [
        user.name,
        user.email,
        user.role,
        user.status,
        user.created,
      ]),
    ]);
  }

  const metricCards = [
    [
      "Usuarios registrados",
      String(demoUsers.length),
      "Directorio de prueba",
      "settings",
      "neutral",
    ],
    [
      "Usuarios activos",
      String(activeUsers),
      `${demoUsers.length - activeUsers} cuenta inactiva`,
      "home",
      "success",
    ],
    [
      "Perfiles definidos",
      String(roles.length),
      "Permisos por módulo",
      "lock",
      "neutral",
    ],
    [
      "Usuarios inactivos",
      String(demoUsers.length - activeUsers),
      "Cuentas de prueba inactivas",
      "lock",
      "warning",
    ],
  ];

  return (
    <ErpModuleShell
      module="administracion"
      title="Administración y seguridad"
      description="Consulta el resumen de administración y el reporte de usuarios."
    >
      <section className="erp-metrics" aria-label="Resumen de administración">
        {metricCards.map(([title, value, detail, icon, tone]) => (
          <article className="erp-card erp-metric" key={title}>
            <div className="erp-metric-heading">
              <h2>{title}</h2>
              <span className={`erp-metric-icon ${tone}`}>
                <ErpIcon name={icon} />
              </span>
            </div>
            <strong className="erp-metric-value">{value}</strong>
            <p className={`erp-metric-detail ${tone}`}>{detail}</p>
          </article>
        ))}
      </section>
      <section className="erp-card module-panel module-admin-panel">
        <div className="erp-section-heading">
          <div>
            <p className="erp-eyebrow">REPORTE DE ADMINISTRACIÓN</p>
            <h2>Reporte de usuarios</h2>
          </div>
          <button
            type="button"
            className="module-secondary-button"
            onClick={exportUsers}
          >
            <ErpIcon name="arrow" />
            Exportar CSV
          </button>
        </div>
        <div className="module-toolbar module-admin-toolbar">
          <label className="erp-search">
            <ErpIcon name="search" />
            <input
              type="search"
              aria-label="Buscar usuario por nombre o correo"
              placeholder="Buscar nombre o correo…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="module-select-label module-admin-select">
            Perfil
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option>Todos</option>
              {roles.map((item) => (
                <option key={item.name}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="module-select-label module-admin-select">
            Estado
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {["Todos", "Activo", "Inactivo"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="module-table-scroll">
          <table className="module-table">
            <caption className="module-visually-hidden">
              Directorio de usuarios de prueba
            </caption>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Perfil</th>
                <th>Estado</th>
                <th>Fecha de creación</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.email}>
                  <td>
                    <div className="module-person">
                      <span className="erp-avatar" aria-hidden="true">
                        {user.name
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <span>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </span>
                    </div>
                  </td>
                  <td>{user.role}</td>
                  <td>
                    <span
                      className={`erp-status ${user.status === "Activo" ? "success" : "danger"}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td>{dateLabel(user.created)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visibleUsers.length === 0 && (
          <p className="erp-empty" role="status">
            No hay usuarios que coincidan con los filtros.
          </p>
        )}
        <p className="module-caption">
          {visibleUsers.length} de {demoUsers.length} usuarios de prueba. El
          reporte exportado incluye los filtros seleccionados.
        </p>
      </section>
    </ErpModuleShell>
  );
}
