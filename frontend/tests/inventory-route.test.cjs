const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { NextResponse } = require("next/server");
async function load(backend) {
  const module = new vm.SourceTextModule(fs.readFileSync(path.join(__dirname, "../src/app/api/inventario/route.js"), "utf8"));
  await module.link((name) => new vm.SyntheticModule(name === "next/server" ? ["NextResponse"] : ["requestVentasBackend"], function () {
    this.setExport(name === "next/server" ? "NextResponse" : "requestVentasBackend", name === "next/server" ? NextResponse : backend);
  }));
  await module.evaluate(); return module.namespace;
}
const request = (token) => ({ cookies: { get: () => token ? { value: token } : undefined } });
test("Inventario exige sesión y transmite los registros reales sin caché", async () => {
  const api = await load(async (url, options) => {
    assert.equal(url, "/Inventario/ListarInventario");
    assert.equal(options.headers.Authorization, "Bearer test");
    return { response: { status: 200 }, result: [{ isbn: "123", stock: 5, minimo: 2, precio: 1000 }] };
  });
  assert.equal((await api.GET(request())).status, 401);
  const response = await api.GET(request("test"));
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal((await response.json())[0].stock, 5);
});
test("Inventario conserva errores y permite informar una conexión caída", async () => {
  const denied = await load(async () => ({ response: { status: 403 }, result: { error: "Sin acceso" } }));
  assert.equal((await denied.GET(request("test"))).status, 403);
  const offline = await load(async () => { throw new Error("Offline"); });
  assert.equal((await offline.GET(request("test"))).status, 503);
});
