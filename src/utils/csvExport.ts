/**
 * Utility for exporting data to CSV format
 */

export interface CsvColumn {
  key: string;
  header: string;
  formatter?: (value: unknown) => string;
}

/**
 * Escape a value for CSV format
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // If the value contains commas, newlines, or quotes, wrap in quotes and escape internal quotes
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate CSV content from data array
 */
export function generateCSV(
  data: Record<string, unknown>[],
  columns: CsvColumn[]
): string {
  // Header row
  const headers = columns.map((c) => escapeCSV(c.header)).join(",");

  // Data rows
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const value = row[c.key];
        const formatted = c.formatter ? c.formatter(value) : value;
        return escapeCSV(formatted);
      })
      .join(",")
  );

  return [headers, ...rows].join("\n");
}

/**
 * Trigger a CSV file download in the browser
 */
export function downloadCSV(
  data: Record<string, unknown>[],
  columns: CsvColumn[],
  filename: string
): void {
  const csv = generateCSV(data, columns);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
