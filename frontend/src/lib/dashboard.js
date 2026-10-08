export function money(value) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
}

export function comparison(current, previous) {
  if (previous === 0) return current === 0 ? "Sin ventas en ambos períodos" : "Sin ventas en el período anterior";
  const percent = ((current - previous) / previous) * 100;
  return `${percent > 0 ? "+" : ""}${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(percent)} %`;
}

// Las fechas de MySQL representan la hora local del negocio, sin un desplazamiento UTC.
export function localDateLabel(value, options) {
  return new Intl.DateTimeFormat("es-CL", { timeZone: "UTC", ...options }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

export function activityDate(item) {
  const date = localDateLabel(item.date, { day: "numeric", month: "short", year: "numeric" });
  return item.dateOnly ? date : `${date} · ${item.date.slice(11, 16)}`;
}

export function chartMaximum(days) {
  return Math.max(1, ...days.map((day) => day.total));
}
