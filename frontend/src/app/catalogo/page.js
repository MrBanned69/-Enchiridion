"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import ErpModuleShell from "@/components/ErpModuleShell";
import ErpIcon from "@/components/ErpIcon";
import { canOpenModule } from "@/lib/module-access";
import { money } from "@/lib/dashboard";

export default function Catalogo() {
  const { usuario } = useAuth();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!usuario || !canOpenModule(usuario, "catalogo")) return;
    const controller = new AbortController();
    fetch("/api/cliente/catalogo", { cache: "no-store", signal: controller.signal })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error); setBooks(result); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [usuario]);
  const visible = books.filter((book) => `${book.titulo} ${book.autor} ${book.categoria} ${book.isbn}`.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es").trim()));
  return <ErpModuleShell module="catalogo" title="Catálogo de libros" description="Explora títulos, autores y precios de nuestra librería." liveData>
    <section className="erp-card module-panel customer-catalog">
      <div className="erp-section-heading"><div><p className="erp-eyebrow">NUESTRA LIBRERÍA</p><h2>Encuentra tu próxima lectura</h2></div><span className="customer-catalog-count">{loading ? "Cargando…" : `${visible.length} títulos`}</span></div>
      <label className="erp-search"><ErpIcon name="search" /><input aria-label="Buscar libros" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Título, autor o ISBN…" /></label>
      {error && <p className="ventas-message ventas-message-error" role="alert">{error}</p>}
      {loading ? <p role="status">Cargando catálogo…</p> : !error && <div className="module-table-scroll"><table className="module-table">
        <thead><tr><th>Libro</th><th>Autor</th><th>Categoría</th><th>Precio</th><th>Disponibilidad</th></tr></thead>
        <tbody>{visible.map((book) => <tr key={book.isbn}><td className="account-user-cell"><strong>{book.titulo}</strong><small>ISBN {book.isbn}</small></td><td>{book.autor || "—"}</td><td>{book.categoria || "—"}</td><td className="customer-book-price">{money(book.precio)}</td><td><span className={`erp-status ${book.disponible ? "success" : "warning"}`}>{book.disponible ? "Disponible" : "Sin existencias"}</span></td></tr>)}</tbody>
      </table>{!visible.length && <p className="erp-empty">No hay libros que coincidan con la búsqueda.</p>}</div>}
    </section>
  </ErpModuleShell>;
}
