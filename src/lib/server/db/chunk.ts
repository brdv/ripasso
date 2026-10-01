/** D1 accepts at most 100 bound parameters per query. */
export const D1_MAX_PARAMS = 100;

/** Splits rows so a multi-row insert of `columns` columns stays within D1's parameter limit. */
export function chunkRows<T>(rows: T[], columns: number): T[][] {
  const size = Math.max(1, Math.floor(D1_MAX_PARAMS / columns));
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size));
  return chunks;
}
