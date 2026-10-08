"use server";

import { cookies } from "next/headers";
import { requestVentasBackend } from "@/lib/ventas-backend";

async function obtenerToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("erp_session")?.value;
  if (!token) {
    throw new Error("Debes iniciar sesión para acceder a este módulo.");
  }
  return token;
}

export async function fetchProveedores(buscar = "") {
  const token = await obtenerToken();
  const query = buscar ? `?buscar=${encodeURIComponent(buscar.trim())}` : "";
  const { response, result } = await requestVentasBackend(`/api/proveedores${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(result.error || "No se pudieron obtener los proveedores.");
  }

  return Array.isArray(result) ? result : [];
}

export async function fetchProveedorPorId(id) {
  const token = await obtenerToken();
  const { response, result } = await requestVentasBackend(`/api/proveedores/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(result.error || "No se pudo obtener el proveedor.");
  }

  return result;
}

export async function crearProveedor(datos) {
  const token = await obtenerToken();
  const { response, result } = await requestVentasBackend("/api/proveedores", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    throw new Error(result.error || "No se pudo registrar el proveedor.");
  }

  return result;
}

export async function editarProveedor(id, datos) {
  const token = await obtenerToken();
  const { response, result } = await requestVentasBackend(`/api/proveedores/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    throw new Error(result.error || "No se pudo actualizar el proveedor.");
  }

  return result;
}
