import { NextResponse } from "next/server";
import { requestVentasBackend } from "@/lib/ventas-backend";

const json = (body, status) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function forward(request, options, action) {
  const token = request.cookies.get("erp_session")?.value;
  if (!token) return json({ error: "Debes iniciar sesión." }, 401);
  try {
    const { response, result } = await requestVentasBackend(`/Administracion/${action}`, {
      ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });
    return json(result, response.status);
  } catch { return json({ error: "No se pudo conectar con Administración." }, 503); }
}

export async function GET(request) {
  return forward(request, {}, "Listar");
}

export async function POST(request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return json({ error: "Solicitud no válida." }, 403);
  if (!request.cookies.get("erp_session")?.value) return json({ error: "Debes iniciar sesión." }, 401);
  let data;
  try { data = await request.json(); } catch { return json({ error: "Datos no válidos." }, 400); }
  if (!data || typeof data !== "object" || Array.isArray(data)) return json({ error: "Datos no válidos." }, 400);
  const fields = new URLSearchParams();
  for (const field of ["id", "nombre", "correo", "password", "idRol", "estado", "rut", "tipoCliente"])
    if (data[field] !== undefined && data[field] !== null) fields.set(field, String(data[field]));
  return forward(request, { method: "POST", body: fields }, "Guardar");
}
