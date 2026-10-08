import { NextResponse } from "next/server";
import { requestVentasBackend } from "@/lib/ventas-backend";

const json = (body, status) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request, context) {
  const { action } = await context.params;
  if (!["catalogo", "perfil"].includes(action)) return json({ error: "Solicitud no válida." }, 404);
  return forward(request, action === "catalogo" ? "Catalogo" : "Perfil", {});
}

export async function POST(request, context) {
  const { action } = await context.params;
  if (action !== "perfil") return json({ error: "Solicitud no válida." }, 404);
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Solicitud no válida." }, 403);
  if (!request.cookies.get("erp_session")?.value) return json({ error: "Debes iniciar sesión." }, 401);
  let data;
  try { data = await request.json(); } catch { return json({ error: "Datos no válidos." }, 400); }
  if (!data || typeof data !== "object" || Array.isArray(data)) return json({ error: "Datos no válidos." }, 400);
  const fields = new URLSearchParams();
  for (const field of ["nombre", "correo", "passwordActual", "password"])
    if (data[field] !== undefined && data[field] !== null) fields.set(field, String(data[field]));
  return forward(request, "GuardarPerfil", { method: "POST", body: fields });
}

async function forward(request, action, options) {
  const token = request.cookies.get("erp_session")?.value;
  if (!token) return json({ error: "Debes iniciar sesión." }, 401);
  try {
    const { response, result } = await requestVentasBackend(`/Cliente/${action}`, {
      ...options, headers: { Authorization: `Bearer ${token}` },
    });
    return json(result, response.status);
  } catch { return json({ error: "No se pudo conectar con el servicio de clientes." }, 503); }
}
