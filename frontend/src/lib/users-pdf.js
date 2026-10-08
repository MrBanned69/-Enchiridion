import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const primary = [155, 68, 68];
const muted = [107, 101, 101];

export function createUsersPdf({ users, totalUsers = users.length, role = "Todos", status = "Todos", search = "", generatedAt = new Date() }) {
  if (!users.length) throw new Error("No hay usuarios para exportar.");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setCreationDate(generatedAt);
  doc.setProperties({ title: "Reporte de usuarios y perfiles", subject: "Administración y seguridad", author: "Librería ERP" });
  const margin = 14;
  const width = doc.internal.pageSize.getWidth();
  const contentWidth = width - margin * 2;
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...primary);
  doc.text("LIBRERÍA ERP / ADMINISTRACIÓN", margin, 16);
  doc.setFontSize(20); doc.setTextColor(44, 44, 44);
  doc.text("Reporte de usuarios y perfiles", margin, 28);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...muted);
  const filters = doc.splitTextToSize(`Perfil: ${role} | Estado: ${status}${search ? ` | Búsqueda: ${search.slice(0, 160)}` : ""}`, contentWidth);
  doc.text(filters, margin, 38);
  let y = 38 + filters.length * 5 + 5;
  const active = users.filter((user) => user.estado === "activo").length;
  const cards = [["USUARIOS EN EL REPORTE", users.length], ["TOTAL REGISTRADOS", totalUsers], ["ACTIVOS SELECCIONADOS", active], ["INACTIVOS SELECCIONADOS", users.length - active]];
  const cardWidth = (contentWidth - 18) / 4;
  cards.forEach(([label, value], index) => {
    const x = margin + index * (cardWidth + 6);
    doc.setFillColor(250, 247, 247); doc.setDrawColor(226, 218, 218);
    doc.roundedRect(x, y, cardWidth, 23, 2, 2, "FD");
    doc.setFontSize(8); doc.setTextColor(...muted); doc.text(label, x + 4, y + 7);
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(...primary);
    doc.text(String(value), x + 4, y + 17); doc.setFont("helvetica", "normal");
  });
  y += 32;
  doc.setFontSize(10); doc.setTextColor(44, 44, 44); doc.setFont("helvetica", "bold");
  doc.text("Directorio de usuarios", margin, y);
  const types = { persona: "Persona", colegio: "Colegio", empresa: "Empresa" };
  autoTable(doc, {
    startY: y + 5,
    margin: { top: 24, left: margin, right: margin, bottom: 18 },
    head: [["Usuario", "Correo electrónico", "Perfil", "Tipo de cliente", "RUT", "Estado", "Fecha de creación"]],
    body: users.map((user) => [user.nombre, user.correo, user.rol, types[user.tipoCliente] || "-", user.rut || "-", user.estado === "activo" ? "Activo" : "Inactivo", user.fechaCreacion]),
    styles: { font: "helvetica", fontSize: 8, cellPadding: 3, textColor: [44, 44, 44], lineColor: [226, 218, 218], lineWidth: .1, overflow: "linebreak" },
    headStyles: { fillColor: primary, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 247, 247] },
    columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 65 }, 2: { cellWidth: 29 }, 3: { cellWidth: 29 }, 4: { cellWidth: 30 }, 5: { cellWidth: 25 } },
    rowPageBreak: "avoid", showHead: "everyPage",
  });
  const issued = new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", dateStyle: "short", timeStyle: "short" }).format(generatedAt);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...muted);
    if (page > 1) { doc.setTextColor(...primary); doc.text("LIBRERÍA ERP / REPORTE DE USUARIOS Y PERFILES", margin, 14); doc.setTextColor(...muted); }
    const footerY = doc.internal.pageSize.getHeight() - 9;
    doc.text(`Emitido: ${issued} | ${users.length} de ${totalUsers} usuarios | Filtros aplicados`, margin, footerY);
    doc.text(`Página ${page} de ${pages}`, width - margin, footerY, { align: "right" });
  }
  return doc;
}
