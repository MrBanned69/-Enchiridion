import { NextResponse } from "next/server";
import { requestVentasBackend } from "@/lib/ventas-backend";

export async function POST(request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Solicitud de venta no válida." }, { status: 403 });
  }
  const token = request.cookies.get("erp_session")?.value;
  if (!token) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          error: "Los datos de la venta no son válidos.",
        },
        { status: 400 },
      );
    }

    const { response, result } = await requestVentasBackend(
      "/Ventas/Registrar",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
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
