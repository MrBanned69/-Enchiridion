import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createUsersPdf } from "../src/lib/users-pdf.js";

const users = [
  { nombre: "Administrador de prueba", correo: "admin@example.test", rol: "Administrador", estado: "activo", fechaCreacion: "2026-10-08" },
  { nombre: "Cliente de prueba", correo: "cliente@example.test", rol: "Cliente", estado: "inactivo", rut: "12.345.678-5", tipoCliente: "persona", fechaCreacion: "2026-10-08" },
];
test("El reporte PDF respeta la selección, contiene filtros y excluye contraseñas", () => {
  const doc = createUsersPdf({ users: [{ ...users[1], password_hash: "NO-EXPORTAR-HASH" }], totalUsers: 8, role: "Cliente", status: "Inactivo", search: "Cliente", generatedAt: new Date("2026-10-08T12:00:00Z") });
  const content = doc.output();
  assert.ok(content.includes("cliente@example.test"));
  assert.ok(content.includes("12.345.678-5"));
  assert.ok(!content.includes("admin@example.test"));
  assert.ok(!content.includes("NO-EXPORTAR-HASH"));
  assert.ok(content.includes("Inactivo"));
  assert.equal(doc.getNumberOfPages(), 1);
});
test("El reporte admite varias páginas y rechaza selecciones vacías", () => {
  const doc = createUsersPdf({ users: Array.from({ length: 100 }, (_, i) => ({ ...users[i % 2], nombre: "Nombre de usuario extenso para comprobar el ajuste de líneas en la tabla del reporte" })) });
  assert.ok(doc.getNumberOfPages() > 2);
  assert.throws(() => createUsersPdf({ users: [] }), /No hay usuarios/);
});
if (process.env.USERS_PDF_PREVIEW_PATH) {
  const doc = createUsersPdf({ users, totalUsers: 2, generatedAt: new Date("2026-10-08T12:00:00Z") });
  fs.writeFileSync(process.env.USERS_PDF_PREVIEW_PATH, Buffer.from(doc.output("arraybuffer")));
}
