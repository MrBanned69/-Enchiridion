"use client";

import ErpModuleShell from "@/components/ErpModuleShell";

export default function Compras() {
  return (
    <ErpModuleShell
      module="compras"
      title="Compras"
      description="Proveedores, órdenes de compra y recepciones de tu librería."
      liveData
      dataLabel="En preparación"
    >
      <section className="erp-card module-panel">
        <div className="erp-section-heading">
          <h2>Gestión de compras</h2>
        </div>
        <p className="erp-muted">
          Las funciones para gestionar proveedores, órdenes de compra y recepciones están pendientes de implementación.
        </p>
      </section>
    </ErpModuleShell>
  );
}
