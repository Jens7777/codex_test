import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const downloadBlob = (content, filename, type = 'application/json') => {
  const blob = new Blob([content], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
};

export const exportModelAsJSON = (model, filename = 'logic-model.json') => {
  const json = JSON.stringify(model, null, 2);
  downloadBlob(json, filename, 'application/json');
};

export const exportDiagramAsPNG = async (element, filename = 'logic-model.png') => {
  if (!element) return;
  const dataUrl = await toPng(element, {
    cacheBust: true,
    backgroundColor: '#f8fafc'
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};

export const exportDiagramAsPDF = async (element, filename = 'logic-model.pdf') => {
  if (!element) return;
  const dataUrl = await toPng(element, {
    cacheBust: true,
    backgroundColor: '#f8fafc'
  });
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });
  const imgProps = pdf.getImageProperties(dataUrl);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
  const width = imgProps.width * ratio;
  const height = imgProps.height * ratio;
  const x = (pageWidth - width) / 2;
  const y = (pageHeight - height) / 2;
  pdf.addImage(dataUrl, 'PNG', x, y, width, height);
  pdf.save(filename);
};
