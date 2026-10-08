import "server-only";
import { backendUrl } from "@/lib/backend-url";

export async function requestVentasBackend(path, options = {}) {
  const response = await fetch(backendUrl(path), {
    ...options,
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  const text = await response.text();

  let result = {};

  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = {
      error: "El backend devolvió una respuesta no válida.",
    };
  }

  return { response, result };
}
