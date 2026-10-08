import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createPurchasesPdf } from "../src/lib/purchases-pdf.js";

const row = { id_proveedor: 1, razon_social: "Proveedor de prueba", numero_ordenes: 4, unidades_compradas: 120, monto_acumulado: 950000, ticket_promedio: 237500, primera_compra: "2026-01-05T00:00:00", ultima_compra: "2026-10-08T00:00:00", ordenes_por_mes: 0.4, dias_promedio_entre_ordenes: null };
const report = { desde: "2026-01-01", hasta: "2026-10-08", total_ordenes: 4, total_unidades: 120, total_monto: 950000, proveedores: [row] };
test("El histórico PDF conserva proveedor, fechas, importes y métricas sin datos", () => {
  const doc = createPurchasesPdf({ report });
  const content = doc.output();
  for (const value of ["Proveedor de prueba", "950.000", "237.500", "05-01-2026", "08-10-2026", "N/A"]) assert.ok(content.includes(value), value);
  assert.equal(doc.getNumberOfPages(), 1);
  assert.throws(() => createPurchasesPdf({ report: { proveedores: [] } }), /No hay compras/);
});
test("El histórico admite métricas camelCase y varias páginas", () => {
  const doc = createPurchasesPdf({ report: { totalOrdenes: 100, totalUnidades: 1000, totalMonto: 999000, proveedores: Array.from({ length: 100 }, (_, i) => ({ idProveedor: i, razonSocial: `Proveedor ${i} con nombre extenso para comprobar el ajuste`, numeroOrdenes: 2, unidadesCompradas: 20, montoAcumulado: 10000, ticketPromedio: 5000, primeraCompra: "2026-01-02", ultimaCompra: "2026-10-05", ordenesPorMes: 1, diasPromedioEntreOrdenes: 4 })) } });
  assert.ok(doc.getNumberOfPages() > 2);
  assert.ok(doc.output().includes("05-10-2026"));
});
if (process.env.PURCHASES_PDF_PREVIEW_PATH) {
  fs.writeFileSync(process.env.PURCHASES_PDF_PREVIEW_PATH, Buffer.from(createPurchasesPdf({ report }).output("arraybuffer")));
}
