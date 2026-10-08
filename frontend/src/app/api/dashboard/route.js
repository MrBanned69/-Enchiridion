import { NextResponse } from "next/server";
import { requestVentasBackend } from "@/lib/ventas-backend";

export async function GET(request) {
  const json = (body, status) => NextResponse.json(body, {
    status, headers: { "Cache-Control": "no-store" },
  });
  const token = request.cookies.get("erp_session")?.value;
  if (!token) return json({ error: "Debes iniciar sesión." }, 401);
  try {
    const { response, result } = await requestVentasBackend("/Dashboard/Resumen", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return json(result, response.status);
  } catch {
    return json({ error: "No se pudo conectar con el servicio del inicio." }, 503);
  }
}
