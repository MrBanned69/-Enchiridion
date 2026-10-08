import { NextResponse } from "next/server";
import { requestVentasBackend } from "@/lib/ventas-backend";

export async function GET(request) {
  try {
    const buscar = request.nextUrl.searchParams.get("buscar") || "";

    const params = new URLSearchParams();

    if (buscar.trim()) {
      params.set("buscar", buscar.trim());
    }

    const query = params.toString();

    const { response, result } = await requestVentasBackend(
      `/Ventas/Libros${query ? `?${query}` : ""}`,
      {
        method: "GET",
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
      {
        error: "No se pudo conectar con el backend.",
      },
      { status: 503 },
    );
  }
}