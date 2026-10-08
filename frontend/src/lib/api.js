// El navegador consulta Next.js; la dirección de ASP.NET queda en el servidor.
export async function fetchLibros() {
  const response = await fetch("/api/libros", { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "No se pudo obtener el catálogo de libros.");
  return result;
}
