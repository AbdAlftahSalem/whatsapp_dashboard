interface ExportOptions {
  filename?: string;
  headers: string[];
  data: (string | number | boolean | null | undefined)[][];
}

export const exportToCSV = ({ filename = 'export', headers, data }: ExportOptions) => {
  if (data.length === 0) return;

  // Create CSV content with UTF-8 BOM for Excel compatibility
  const csvContent = "\uFEFF" + [headers, ...data]
    .map(e => e.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = ({ filename = 'export', data }: { filename?: string, data: any }) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
