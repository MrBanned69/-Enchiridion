import "server-only";

// Esta dirección solo se usa en el servidor de Next.js, nunca en el navegador.
export async function requestBackend(action, options = {}) {
  const baseUrl = process.env.ERP_BACKEND_URL || "https://localhost:44379";
  const response = await fetch(new URL(`/Login/${action}`, baseUrl), {
    ...options,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  return { response, result };
}
