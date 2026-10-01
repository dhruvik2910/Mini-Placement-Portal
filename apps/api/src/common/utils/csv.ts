/**
 * Institutional CSV Generator Utility for LDCE Placement Portal
 * Implements RFC 4180 standard escaping with UTF-8 BOM for Microsoft Excel / Google Sheets compatibility.
 */

export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvField).join(','));
  // Prepend UTF-8 BOM (\uFEFF) so Excel correctly handles encoding without garbled text
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}
