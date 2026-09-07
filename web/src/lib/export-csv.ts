/**
 * Helper utility to export data to CSV with UTF-8 BOM for Excel compatibility.
 */
export interface CsvColumn<T = any> {
  header: string;
  accessor: keyof T | ((row: T) => any);
}

export function exportToCsv<T = any>(filename: string, columns: CsvColumn<T>[], rows: T[]): void {
  if (typeof window === 'undefined') return;

  const escapeCsvValue = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = columns.map((c) => escapeCsvValue(c.header)).join(';');

  const dataRows = rows.map((row) =>
    columns
      .map((col) => {
        let value: any;
        if (typeof col.accessor === 'function') {
          value = col.accessor(row);
        } else {
          value = row[col.accessor];
        }
        return escapeCsvValue(value);
      })
      .join(';')
  );

  // UTF-8 BOM '\uFEFF' ensures Microsoft Excel interprets accents (á, é, č, š, ž...) correctly
  const csvContent = '\uFEFF' + [headers, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
