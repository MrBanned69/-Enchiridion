export function canOpenModule(usuario, module) {
  const role = (usuario?.rol || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  if (["administrador", "administradora", "admin"].includes(role)) {
    return true;
  }

  if (module === "contabilidad") {
    return ["contador", "contadora"].includes(role);
  }

  if (module === "ventas") {
    return ["vendedor", "vendedora"].includes(role);
  }

  return false;
}