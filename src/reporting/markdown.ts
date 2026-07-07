/** Escape pipe characters so markdown table cells are not split. */
export function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|');
}
