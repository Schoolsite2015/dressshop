import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

/**
 * Export data to PDF using jsPDF and autotable
 * @param {string} title - The title of the document
 * @param {Array<string>} headers - Array of column headers
 * @param {Array<Array<any>>} data - 2D array of row data
 * @param {string} filename - Output filename (e.g., 'report.pdf')
 */
export const exportToPDF = (title, headers, data, filename = "report.pdf") => {
  const doc = new jsPDF();
  
  // Add Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add Date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  // Add Table
  doc.autoTable({
    startY: 36,
    head: [headers],
    body: data,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [44, 54, 112] }, // Navy Blue (School OS primary)
    alternateRowStyles: { fillColor: [249, 250, 251] }, // gray-50
  });

  doc.save(filename);
};

/**
 * Export data to Excel (XLSX)
 * @param {Array<Object>} data - Array of objects representing rows
 * @param {string} filename - Output filename (e.g., 'report.xlsx')
 */
export const exportToExcel = (data, filename = "report.xlsx") => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  
  // Save file
  XLSX.writeFile(workbook, filename);
};
