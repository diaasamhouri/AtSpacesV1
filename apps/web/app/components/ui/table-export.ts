"use client";

export function exportToCSV(headers: string[], rows: string[][], filename: string) {
  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvContent = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportToPDF(headers: string[], rows: string[][], filename: string, title?: string) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: rows[0] && rows[0].length > 6 ? "landscape" : "portrait" });

  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  }

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: title ? 34 : 14,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`${filename}.pdf`);
}
