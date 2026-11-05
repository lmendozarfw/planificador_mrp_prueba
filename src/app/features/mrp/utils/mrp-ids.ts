export function nextId(prefix: string, existing: string[]): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  for (const id of existing) {
    const match = pattern.exec(id);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export function generarIdEjecucion(fecha: string): string {
  const limpia = fecha.replaceAll('-', '');
  return `MRP-${limpia}-0001`;
}

export function nuevoId(prefix: string, items: { [key: string]: unknown }[], key: string): string {
  return nextId(
    prefix,
    items.map((item) => String(item[key] ?? '')),
  );
}
