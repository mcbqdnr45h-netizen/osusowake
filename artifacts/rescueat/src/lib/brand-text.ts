export function normalizeBrand(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/OsusOwake/g, 'おすそわけ')
    .replace(/Osusowake/g, 'おすそわけ')
    .replace(/OSUSOWAKE/gi, 'おすそわけ')
    .replace(/osusowake/g, 'おすそわけ')
    .replace(/おすそ分け/g, 'おすそわけ');
}
