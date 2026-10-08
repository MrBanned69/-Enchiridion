import "server-only";

export async function requestVentasBackend(path, options = {}) {
  const baseUrl =
    process.env.ERP_BACKEND_URL || "https://localhost:44379";

  const response = await fetch(new URL(path, baseUrl), {
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