import { NextResponse } from "next/server";
import { requestVentasBackend } from "@/lib/ventas-backend";

export async function POST(request) {
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