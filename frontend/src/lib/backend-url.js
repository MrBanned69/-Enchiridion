import "server-only";

export function backendUrl(path) {
  return new URL(path, process.env.ERP_BACKEND_URL || "http://localhost:5000");
}
