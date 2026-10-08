const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { NextResponse } = require("next/server");

async function route(backend) {
  const module = new vm.SourceTextModule(fs.readFileSync(path.join(__dirname, "../src/app/api/dashboard/route.js"), "utf8"));
  await module.link((name) => new vm.SyntheticModule(name === "next/server" ? ["NextResponse"] : ["requestVentasBackend"], function () {
    this.setExport(name === "next/server" ? "NextResponse" : "requestVentasBackend", name === "next/server" ? NextResponse : backend);
  }));
  await module.evaluate();
  return module.namespace;
}
const request = (token) => ({ cookies: { get: () => token ? { value: token } : undefined } });
test("El inicio rechaza una consulta sin sesión", async () => {
  const api = await route(() => assert.fail("No debe llamar al backend"));
  assert.equal((await api.GET(request())).status, 401);
});
test("El inicio transmite la sesión y devuelve registros sin caché", async () => {
  const payload = { success: true, salesToday: 11900, days: [], books: [] };
  const api = await route(async (url, options) => {
    assert.equal(url, "/Dashboard/Resumen");
    assert.equal(options.headers.Authorization, "Bearer session-test");
    return { response: { status: 200 }, result: payload };
  });
  const response = await api.GET(request("session-test"));
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), payload);
});
test("Los errores de sesión y conexión no se reemplazan con valores ficticios", async () => {
  const denied = await route(async () => ({ response: { status: 401 }, result: { error: "Sesión vencida" } }));
  assert.equal((await denied.GET(request("session-test"))).status, 401);
  const offline = await route(async () => { throw new Error("Offline"); });
  const response = await offline.GET(request("session-test"));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).salesToday, undefined);
});
test("El gráfico y las comparaciones manejan ceros y caídas", async () => {
  const module = new vm.SourceTextModule(fs.readFileSync(path.join(__dirname, "../src/lib/dashboard.js"), "utf8"));
  await module.link(() => assert.fail("Sin dependencias"));
  await module.evaluate();
  const { comparison, chartMaximum, localDateLabel, activityDate } = module.namespace;
  assert.equal(comparison(0, 0), "Sin ventas en ambos períodos");
  assert.equal(comparison(100, 0), "Sin ventas en el período anterior");
  assert.equal(comparison(50, 100), "-50 %");
  assert.equal(chartMaximum([]), 1);
  assert.equal(chartMaximum([{ total: 0 }, { total: 11900 }]), 11900);
  assert.equal(localDateLabel("2026-10-08", { day: "numeric" }), "8");
  assert.match(activityDate({ date: "2026-10-08T23:59:00", dateOnly: false }), /23:59$/);
  assert.doesNotMatch(activityDate({ date: "2026-10-08T00:00:00", dateOnly: true }), /00:00/);
});
