import "server-only";
import { backendUrl } from "@/lib/backend-url";

// Esta dirección solo se usa en el servidor de Next.js, nunca en el navegador.
export async function requestBackend(action, options = {}) {
  const response = await fetch(backendUrl(`/Login/${action}`), {
    ...options,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  return { response, result };
}
