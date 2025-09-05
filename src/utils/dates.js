// Utilidades de fecha para formato DD-MM-YYYY

// Convierte un Date o string a 'DD-MM-YYYY' para mostrar
export function formatToDDMMYYYY(input) {
  try {
    if (!input) return '';
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return '';
  }
}

// Parsea 'DD-MM-YYYY' a 'YYYY-MM-DD' (string) para API
export function parseDDMMYYYYToISO(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const parts = dateStr.trim().split(/[-\/]/);
  if (parts.length !== 3) return '';
  const [dd, mm, yyyy] = parts.map((p) => p.padStart(2, '0'));
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(yyyy, 10);
  if (!year || !month || !day) return '';
  // Validación básica
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Intenta formatear cualquier valor recibido a DD-MM-YYYY de manera tolerante
export function formatDisplayDateSafe(value) {
  if (!value) return '';
  // Si ya viene en DD-MM-YYYY, devolver tal cual
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) return value;
  return formatToDDMMYYYY(value);
}
