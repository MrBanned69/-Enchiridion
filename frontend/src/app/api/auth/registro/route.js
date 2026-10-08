import { NextResponse } from "next/server";
import { requestBackend } from "@/lib/auth-backend";

export async function POST(request) {
  const json = (body, status) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return json({ error: "Solicitud de registro no válida." }, 403);
  let data;
  try { data = await request.json(); } catch { return json({ error: "Datos no válidos." }, 400); }
  if (!data || typeof data !== "object" || Array.isArray(data)) return json({ error: "Datos no válidos." }, 400);
  if (typeof data.nombre !== "string" || !data.nombre.trim() || data.nombre.trim().length > 100 ||
      typeof data.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) || data.email.trim().length > 100 ||
      typeof data.password !== "string" || data.password.length < 8 || new TextEncoder().encode(data.password).length > 72 ||
      typeof data.rut !== "string" || !data.rut.trim())
    return json({ error: "Completa nombre, RUT y correo válido. La contraseña debe tener al menos 8 caracteres y no ser demasiado larga." }, 400);
  try {
    const { response, result } = await requestBackend("Registrar", {
      method: "POST",
      body: new URLSearchParams({ nombre: data.nombre.trim(), email: data.email.trim(), password: data.password, rut: data.rut.trim() }),
    });
    return json(response.ok ? { success: true } : { error: result.error || "No se pudo registrar la cuenta." }, response.status);
  } catch { return json({ error: "No se pudo conectar con el servicio de registro." }, 503); }
}
