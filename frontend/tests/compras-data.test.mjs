import test from "node:test";
import assert from "node:assert/strict";
import { normalizeComprasData } from "../src/lib/compras-data.js";

test("Los proveedores del backend conservan identificadores únicos para los selectores", () => {
  const proveedores = normalizeComprasData([
    { IdProveedor: 1, RazonSocial: "Proveedor A", Contacto: null },
    { IdProveedor: 2, RazonSocial: "Proveedor B", Contacto: "Ventas" },
  ]);
  assert.deepEqual(proveedores.map((p) => p.idProveedor), [1, 2]);
  assert.equal(new Set(proveedores.map((p) => p.idProveedor)).size, 2);
  assert.equal(proveedores[0].razonSocial, "Proveedor A");
  assert.equal(proveedores[0].contacto, null);
});

test("Las órdenes, líneas y libros mantienen los campos que usa Compras", () => {
  assert.deepEqual(normalizeComprasData({
    IdOc: 7,
    IdProveedor: 2,
    Total: 12000,
    Lineas: [{ Isbn: "9780000000001", Cantidad: 3, PrecioPactado: 4000 }],
  }), {
    idOc: 7,
    idProveedor: 2,
    total: 12000,
    lineas: [{ isbn: "9780000000001", cantidad: 3, precioPactado: 4000 }],
  });
  assert.deepEqual(normalizeComprasData([{ Isbn: "9780000000001", Titulo: "Libro", CostoUnitario: 4000 }]),
    [{ isbn: "9780000000001", titulo: "Libro", costoUnitario: 4000 }]);
});

test("Los reportes existentes en snake_case o camelCase conservan sus datos", () => {
  const reporte = { total_monto: 12000, proveedores: [{ id_proveedor: 2, razon_social: "Proveedor B", montoAcumulado: 12000 }] };
  assert.deepEqual(normalizeComprasData(reporte), reporte);
});
