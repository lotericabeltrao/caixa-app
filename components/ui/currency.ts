export function sanitizeNumber(input: any): number {
  if (input === null || input === undefined) return 0;
  const s = String(input).trim();
  if (!s) return 0;
  const clean = s.replace(/[^\d,.-]/g, "");
  const normalized = clean.replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const n = Number(normalized);
  return isFinite(n) ? n : 0;
}
