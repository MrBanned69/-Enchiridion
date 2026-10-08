import { NextResponse } from "next/server";
import { requestVentasBackend } from "@/lib/ventas-backend";

export async function GET(request) {
  const token = request.cookies.get("erp_session")?.value;
  if (!token) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const desde = request.nextUrl.searchParams.get("desde") || "";
    const hasta = request.nextUrl.searchParams.get("hasta") || "";

    const params = new URLSearchParams();

    if (desde.trim()) {
      params.set("desde", desde.trim());
    }

    if (hasta.trim()) {
      params.set("hasta", hasta.trim());
    }

    const query = params.toString();

    const { response, result } = await requestVentasBackend(
      `/Ventas/ReporteClientes${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return NextResponse.json(result, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con el backend." },
      { status: 503 },
    );
  }
}
