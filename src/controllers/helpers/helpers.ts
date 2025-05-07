export function sanitize(value: string): string {
    if (!value) return '';
    return value.replace(/'/g, "''");
  }

export function safeValue(value: any): any {
  if (Buffer.isBuffer(value)) {
    try {
      return value.toString('utf8');
    } catch (e) {
      try {
        return value.toString('latin1');
      } catch (err) {
        console.error('No se pudo convertir el buffer, asignando valor por defecto', err);
        return null;
      }
    }
  }
  return value;
}