import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const primary = [155, 68, 68];
const muted = [107, 101, 101];
const number = (value) => new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(Number(value) || 0);
const money = (value) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Number(value) || 0);
const date = (value) => value ? String(value).slice(0, 10).split("-").reverse().join("-") : "-";

export function createPurchasesPdf({ report, from = "", to = "", generatedAt = new Date() }) {
  const rows = report?.proveedores || [];
  if (!rows.length) throw new Error("No hay compras para exportar.");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setCreationDate(generatedAt);
  doc.setProperties({ title: "Histórico de compras por proveedor", author: "Librería ERP" });
  const margin = 14;
  const width = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...primary);
  doc.text("LIBRERÍA ERP / COMPRAS", margin, 16);
  doc.setFontSize(20); doc.setTextColor(44, 44, 44);
  doc.text("Histórico de compras por proveedor", margin, 28);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...muted);
  doc.text(`Período: ${date(report.desde || from)} al ${date(report.hasta || to)} | Proveedores en el reporte: ${rows.length}`, margin, 38);
  const cards = [
    ["ÓRDENES DE COMPRA", number(report.total_ordenes ?? report.totalOrdenes)],
    ["UNIDADES COMPRADAS", number(report.total_unidades ?? report.totalUnidades)],
    ["MONTO ACUMULADO", money(report.total_monto ?? report.totalMonto)],
  ];
  const cardWidth = (width - margin * 2 - 12) / 3;
  cards.forEach(([label, value], index) => {
    const x = margin + index * (cardWidth + 6);
    doc.setFillColor(250, 247, 247); doc.setDrawColor(226, 218, 218);
    doc.roundedRect(x, 46, cardWidth, 23, 2, 2, "FD");
    doc.setFontSize(8); doc.setTextColor(...muted); doc.text(label, x + 4, 53);
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(...primary);
    doc.text(value, x + 4, 63); doc.setFont("helvetica", "normal");
  });
  autoTable(doc, {
    startY: 78, margin: { top: 24, left: margin, right: margin, bottom: 18 },
    head: [["ID", "Razón social", "Órdenes", "Unidades", "Monto (CLP)", "Ticket promedio (CLP)", "Primera compra", "Última compra", "Órdenes por mes", "Días promedio entre órdenes"]],
    body: rows.map((row) => [
      row.id_proveedor ?? row.idProveedor, row.razon_social ?? row.razonSocial,
      number(row.numero_ordenes ?? row.numeroOrdenes), number(row.unidades_compradas ?? row.unidadesCompradas),
      money(row.monto_acumulado ?? row.montoAcumulado), money(row.ticket_promedio ?? row.ticketPromedio),
      date(row.primera_compra ?? row.primeraCompra), date(row.ultima_compra ?? row.ultimaCompra),
      number(row.ordenes_por_mes ?? row.ordenesPorMes),
      (row.dias_promedio_entre_ordenes ?? row.diasPromedioEntreOrdenes) == null ? "N/A" : number(row.dias_promedio_entre_ordenes ?? row.diasPromedioEntreOrdenes),
    ]),
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2.5, textColor: [44, 44, 44], lineColor: [226, 218, 218], lineWidth: .1, overflow: "linebreak" },
    headStyles: { fillColor: primary, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 247, 247] },
    columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 46 }, 2: { cellWidth: 17 }, 3: { cellWidth: 21 }, 4: { cellWidth: 33 }, 5: { cellWidth: 30 }, 6: { cellWidth: 26 }, 7: { cellWidth: 26 }, 8: { cellWidth: 21 } },
    rowPageBreak: "avoid", showHead: "everyPage",
  });
  const issued = new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", dateStyle: "short", timeStyle: "short" }).format(generatedAt);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...muted);
    if (page > 1) doc.text("LIBRERÍA ERP / HISTÓRICO DE COMPRAS POR PROVEEDOR", margin, 14);
    const footerY = doc.internal.pageSize.getHeight() - 9;
    doc.text(`Emitido: ${issued} | ${rows.length} proveedores | Filtros aplicados`, margin, footerY);
    doc.text(`Página ${page} de ${pages}`, width - margin, footerY, { align: "right" });
  }
  return doc;
}
