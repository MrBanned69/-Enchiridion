const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { NextResponse } = require("next/server");

const user = {
  id_usuario: "7",
  id_rol: "3",
  nombre: "Ana Martínez",
  correo: "ana@example.test",
  rol: "Vendedor",
};
let backendCalls = 0;
let backend = async () => {
  throw new Error("Unexpected backend call");
};

async function loadRoute() {
  const routeModule = new vm.SourceTextModule(
    fs.readFileSync(
      path.join(__dirname, "../src/app/api/auth/route.js"),
      "utf8",
    ),
  );
  await routeModule.link(async (specifier) => {
    if (specifier === "next/server") {
      return new vm.SyntheticModule(["NextResponse"], function () {
        this.setExport("NextResponse", NextResponse);
      });
    }
    if (specifier === "@/lib/auth-backend") {
      return new vm.SyntheticModule(["requestBackend"], function () {
        this.setExport("requestBackend", async (...args) => {
          backendCalls++;
          return backend(...args);
        });
      });
    }
    throw new Error("Unexpected import: " + specifier);
  });
  await routeModule.evaluate();
  return routeModule.namespace;
}

function request({
  origin = "https://erp.example.test",
  body = {},
  token,
} = {}) {
  return {
    url: "https://erp.example.test/api/auth",
    headers: new Headers({ origin }),
    cookies: { get: () => (token ? { value: token } : undefined) },
    json: async () => body,
  };
}
function upstream(status, result) {
  return { response: { ok: status >= 200 && status < 300, status }, result };
}

test("Contrato de autenticación entre el navegador y el backend", async (t) => {
  process.env.NODE_ENV = "production";
  const route = await loadRoute();

  await t.test("rechaza inicios de sesión desde otro origen", async () => {
    backendCalls = 0;
    const response = await route.POST(
      request({ origin: "https://otro.example.test" }),
    );
    assert.equal(response.status, 403);
    assert.equal(backendCalls, 0);
  });

  await t.test("valida campos antes de consultar el backend", async () => {
    backendCalls = 0;
    const response = await route.POST(
      request({ body: { email: "   ", password: "" } }),
    );
    assert.equal(response.status, 400);
    assert.equal(backendCalls, 0);
  });

  await t.test(
    "devuelve el usuario e impide que JavaScript lea el comprobante",
    async () => {
      backend = async (action, options) => {
        assert.equal(action, "Ingresar");
        assert.equal(options.body.get("email"), "ana@example.test");
        assert.equal(options.body.get("password"), "clave-de-prueba");
        return upstream(200, {
          success: true,
          usuario: user,
          sessionToken: "comprobante-cifrado",
          expiresIn: 28800,
        });
      };
      const response = await route.POST(
        request({
          body: { email: " ana@example.test ", password: "clave-de-prueba" },
        }),
      );
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { usuario: user });
      const cookie = response.headers.get("set-cookie");
      assert.match(cookie, /erp_session=comprobante-cifrado/);
      assert.match(cookie, /HttpOnly/i);
      assert.match(cookie, /SameSite=lax/i);
      assert.match(cookie, /Secure/i);
      assert.match(cookie, /Max-Age=28800/i);
    },
  );

  await t.test("una clave incorrecta borra una cookie anterior", async () => {
    backend = async () =>
      upstream(401, { success: false, error: "Clave inválida" });
    const response = await route.POST(
      request({ body: { email: "ana@example.test", password: "incorrecta" } }),
    );
    assert.equal(response.status, 401);
    assert.match(response.headers.get("set-cookie"), /Max-Age=0/i);
    assert.equal((await response.json()).usuario, undefined);
  });

  await t.test(
    "sin cookie el home no tiene un usuario autenticado",
    async () => {
      backendCalls = 0;
      const response = await route.GET(request());
      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { usuario: null });
      assert.equal(backendCalls, 0);
    },
  );

  await t.test(
    "la consulta de sesión vuelve a pedir nombre y rol al backend",
    async () => {
      backend = async (action, options) => {
        assert.equal(action, "Sesion");
        assert.equal(
          options.headers.Authorization,
          "Bearer comprobante-cifrado",
        );
        return upstream(200, {
          success: true,
          usuario: { ...user, nombre: "Ana María Martínez", rol: "Contador" },
        });
      };
      const response = await route.GET(
        request({ token: "comprobante-cifrado" }),
      );
      assert.equal(response.status, 200);
      assert.equal((await response.json()).usuario.rol, "Contador");
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  );

  await t.test("sesión vencida o manipulada elimina la cookie", async () => {
    backend = async () => upstream(401, { success: false });
    const response = await route.GET(
      request({ token: "comprobante-invalido" }),
    );
    assert.equal(response.status, 401);
    assert.match(response.headers.get("set-cookie"), /Max-Age=0/i);
  });

  await t.test("un backend caído se informa sin borrar la sesión", async () => {
    backend = async () => {
      throw new Error("Connection refused");
    };
    const response = await route.GET(request({ token: "comprobante-cifrado" }));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("set-cookie"), null);
  });

  await t.test("no admite una respuesta de login sin comprobante", async () => {
    backend = async () => upstream(200, { success: true, usuario: user });
    const response = await route.POST(
      request({
        body: { email: "ana@example.test", password: "clave-de-prueba" },
      }),
    );
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("set-cookie"), null);
  });

  await t.test(
    "cerrar sesión elimina la cookie sin depender del backend",
    async () => {
      backendCalls = 0;
      const response = await route.DELETE(
        request({ token: "comprobante-cifrado" }),
      );
      assert.equal(response.status, 200);
      assert.match(response.headers.get("set-cookie"), /Max-Age=0/i);
      assert.equal(backendCalls, 0);
      assert.equal(
        (await route.DELETE(request({ origin: "https://otro.example.test" })))
          .status,
        403,
      );
    },
  );
});
