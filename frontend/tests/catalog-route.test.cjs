const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { NextResponse } = require("next/server");

async function load(backend) {
  const module = new vm.SourceTextModule(fs.readFileSync(path.join(__dirname, "../src/app/api/libros/route.js"), "utf8"));
  await module.link((name) => new vm.SyntheticModule(name === "next/server" ? ["NextResponse"] : ["requestVentasBackend"], function () {
    this.setExport(name === "next/server" ? "NextResponse" : "requestVentasBackend", name === "next/server" ? NextResponse : backend);
  }));
  await module.evaluate();
  return module.namespace;
}
const request = (token) => ({ cookies: { get: () => token ? { value: token } : undefined } });

test("Catálogo exige sesión antes de consultar ASP.NET", async () => {
  const api = await load(() => assert.fail("No debe consultar sin sesión"));
  assert.equal((await api.GET(request())).status, 401);
});
test("Catálogo transmite sesión y conserva los datos sin caché", async () => {
  const books = [{ isbn: "123", titulo: "Libro", stockActual: 5 }];
  const api = await load(async (url, options) => {
    assert.equal(url, "/api/libros");
    assert.equal(options.headers.Authorization, "Bearer test");
    return { response: { status: 200 }, result: books };
  });
  const response = await api.GET(request("test"));
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), books);
});
test("Catálogo conserva sesión vencida e informa caídas", async () => {
  const expired = await load(async () => ({ response: { status: 401 }, result: { error: "Sesión vencida" } }));
  assert.equal((await expired.GET(request("test"))).status, 401);
  const offline = await load(async () => { throw new Error("Offline"); });
  assert.equal((await offline.GET(request("test"))).status, 503);
});
test("La conexión usa el puerto del arranque y admite configuración del servidor", async () => {
  const context = vm.createContext({ URL, process: { env: {} } });
  const module = new vm.SourceTextModule(fs.readFileSync(path.join(__dirname, "../src/lib/backend-url.js"), "utf8"), { context });
  await module.link(() => new vm.SyntheticModule([], function () {}, { context }));
  await module.evaluate();
  assert.equal(module.namespace.backendUrl("/Login/Ingresar").href, "http://localhost:5000/Login/Ingresar");
  context.process.env.ERP_BACKEND_URL = "https://localhost:44379";
  assert.equal(module.namespace.backendUrl("/Ventas/Registrar").href, "https://localhost:44379/Ventas/Registrar");
});
