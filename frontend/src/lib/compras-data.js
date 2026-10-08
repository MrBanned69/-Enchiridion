// Web API devuelve los DTO de C# en PascalCase; las vistas usan camelCase.
export function normalizeComprasData(value) {
  if (Array.isArray(value)) return value.map(normalizeComprasData);
  if (value === null || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key.charAt(0).toLowerCase() + key.slice(1),
      normalizeComprasData(item),
    ]),
  );
}
