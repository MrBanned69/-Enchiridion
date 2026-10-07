export function createCsv(rows) {
  const content = rows
    .map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";"),
    )
    .join("\r\n");

  return "\uFEFFsep=;\r\n" + content + "\r\n";
}
