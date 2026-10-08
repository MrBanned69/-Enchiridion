import { createCsv } from "./csv";

export const periods = [
  { value: "2026-10", label: "Octubre 2026", status: "Abierto" },
  { value: "2026-09", label: "Septiembre 2026", status: "Cerrado" },
];

export const accounts = [
  { code: "1.1.01", name: "Caja", type: "Activo" },
  { code: "1.1.02", name: "Banco", type: "Activo" },
  { code: "1.1.03", name: "Inventario de libros", type: "Activo" },
  { code: "1.1.04", name: "IVA crédito fiscal", type: "Activo" },
  { code: "2.1.01", name: "Proveedores", type: "Pasivo" },
  { code: "2.1.02", name: "IVA débito fiscal", type: "Pasivo" },
  { code: "4.1.01", name: "Ingresos por ventas", type: "Ingreso" },
  { code: "5.1.01", name: "Costo de ventas", type: "Costo" },
  { code: "5.2.01", name: "Gastos operacionales", type: "Gasto" },
];

export const entries = [
  {
    code: "AS-0001",
    date: "2026-10-01",
    source: "Ventas",
    document: "B-002341",
    description: "Venta de libros en Casa Matriz",
    lines: [
      { account: "1.1.01", debit: 1250000, credit: 0 },
      { account: "4.1.01", debit: 0, credit: 1050420 },
      { account: "2.1.02", debit: 0, credit: 199580 },
    ],
  },
  {
    code: "AS-0002",
    date: "2026-10-01",
    source: "Ventas",
    document: "B-002341",
    description: "Costo de los libros vendidos",
    lines: [
      { account: "5.1.01", debit: 650000, credit: 0 },
      { account: "1.1.03", debit: 0, credit: 650000 },
    ],
  },
  {
    code: "AS-0003",
    date: "2026-10-03",
    source: "Compras",
    document: "F-00128",
    description: "Compra a crédito · Editorial Planeta",
    lines: [
      { account: "1.1.03", debit: 407563, credit: 0 },
      { account: "1.1.04", debit: 77437, credit: 0 },
      { account: "2.1.01", debit: 0, credit: 485000 },
    ],
  },
  {
    code: "AS-0004",
    date: "2026-10-05",
    source: "Manual",
    document: "AJ-00001",
    description: "Gastos operacionales de la librería",
    lines: [
      { account: "5.2.01", debit: 120000, credit: 0 },
      { account: "1.1.02", debit: 0, credit: 120000 },
    ],
  },
  {
    code: "AS-0005",
    date: "2026-09-28",
    source: "Ventas",
    document: "B-002340",
    description: "Venta de libros de septiembre",
    lines: [
      { account: "1.1.01", debit: 800000, credit: 0 },
      { account: "4.1.01", debit: 0, credit: 672269 },
      { account: "2.1.02", debit: 0, credit: 127731 },
    ],
  },
  {
    code: "AS-0006",
    date: "2026-09-28",
    source: "Ventas",
    document: "B-002340",
    description: "Costo de libros vendidos de septiembre",
    lines: [
      { account: "5.1.01", debit: 450000, credit: 0 },
      { account: "1.1.03", debit: 0, credit: 450000 },
    ],
  },
  {
    code: "AS-0007",
    date: "2026-09-30",
    source: "Manual",
    document: "AJ-00000",
    description: "Gastos operacionales de septiembre",
    lines: [
      { account: "5.2.01", debit: 90000, credit: 0 },
      { account: "1.1.02", debit: 0, credit: 90000 },
    ],
  },
];

export const roles = [
  {
    name: "Administrador",
    description: "Administración general del ERP.",
    permissions: ["Total", "Total", "Total", "Total", "Total"],
  },
  {
    name: "Comprador",
    description: "Compras y consulta del inventario.",
    permissions: [
      "Editar",
      "Sin acceso",
      "Consulta",
      "Sin acceso",
      "Sin acceso",
    ],
  },
  {
    name: "Vendedor",
    description: "Ventas y consulta del inventario.",
    permissions: [
      "Sin acceso",
      "Editar",
      "Consulta",
      "Sin acceso",
      "Sin acceso",
    ],
  },
  {
    name: "Contador",
    description: "Contabilidad y consulta de operaciones.",
    permissions: ["Consulta", "Consulta", "Consulta", "Editar", "Sin acceso"],
  },
];

export const demoUsers = [
  {
    name: "Ana Martínez",
    email: "ana@libreria.example",
    role: "Administrador",
    status: "Activo",
    created: "2026-09-01",
  },
  {
    name: "Luis Pérez",
    email: "luis@libreria.example",
    role: "Comprador",
    status: "Activo",
    created: "2026-09-02",
  },
  {
    name: "Sofía Rojas",
    email: "sofia@libreria.example",
    role: "Vendedor",
    status: "Activo",
    created: "2026-09-03",
  },
  {
    name: "Diego Silva",
    email: "diego@libreria.example",
    role: "Contador",
    status: "Activo",
    created: "2026-09-04",
  },
  {
    name: "Camila Torres",
    email: "camila@libreria.example",
    role: "Vendedor",
    status: "Inactivo",
    created: "2026-09-05",
  },
];

export const auditEvents = [
  {
    date: "2026-10-06",
    time: "09:40",
    user: "Ana Martínez",
    module: "Administración",
    action: "Consulta del directorio de usuarios",
    status: "Exitoso",
  },
  {
    date: "2026-10-06",
    time: "09:25",
    user: "Diego Silva",
    module: "Contabilidad",
    action: "Consulta del libro diario",
    status: "Exitoso",
  },
  {
    date: "2026-10-06",
    time: "09:12",
    user: "Camila Torres",
    module: "Acceso",
    action: "Intento de ingreso de cuenta inactiva",
    status: "Fallido",
  },
  {
    date: "2026-10-06",
    time: "09:05",
    user: "Sofía Rojas",
    module: "Acceso",
    action: "Inicio de sesión",
    status: "Exitoso",
  },
  {
    date: "2026-10-05",
    time: "16:30",
    user: "Luis Pérez",
    module: "Compras",
    action: "Consulta de órdenes de compra",
    status: "Exitoso",
  },
];

export function money(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function dateLabel(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function totals(selectedEntries) {
  const lines = selectedEntries.flatMap((entry) => entry.lines);
  const round = (value) => Math.round(value * 100) / 100;
  const balance = (code) =>
    lines
      .filter((line) => line.account === code)
      .reduce((sum, line) => round(sum + line.credit - line.debit), 0);
  const debit = lines.reduce((sum, line) => round(sum + line.debit), 0);
  const credit = lines.reduce((sum, line) => round(sum + line.credit), 0);
  const income = balance("4.1.01");
  const costs = -balance("5.1.01");
  const expenses = round(-balance("5.2.01") - balance("5.1.02"));
  return {
    debit,
    credit,
    income,
    costs,
    expenses,
    result: round(income - costs - expenses),
  };
}

export function downloadCsv(filename, rows) {
  const url = URL.createObjectURL(
    new Blob([createCsv(rows)], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
