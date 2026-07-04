/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';

/**
 * Generates a clean, beautifully styled PDF of the AI study notes.
 * Includes layout formatting, colored section accents, custom bullet point blocks,
 * and page numbering.
 */
export function generateStudyNotesPDF(title: string, rawMarkdown: string | null, fileNames: string[]) {
  if (!rawMarkdown) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 20;
  const contentWidth = pageWidth - (marginX * 2);
  let y = 25;

  const drawPageDecorations = (pageNumber: number, totalPages: number) => {
    // Elegant minor header on later pages
    if (pageNumber > 1) {
      doc.setFillColor(248, 250, 252); // extremely light grey-slate
      doc.rect(0, 0, pageWidth, 12, 'F');
      
      // Secondary minor accent line
      doc.setFillColor(14, 165, 233); // Cyan-500
      doc.rect(0, 0, pageWidth, 2.5, 'F');

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text('ACADEMICX - STUDY SUITE NOTES', marginX, 8);
    } else {
      // Title page major accent slide strip
      doc.setFillColor(14, 165, 233); // Cyan-500
      doc.rect(0, 0, pageWidth, 4, 'F');
    }

    doc.setFillColor(14, 165, 233); // Always subtle page accent left strip
    doc.rect(0, 0, 3, pageHeight, 'F');

    // Solid footer text
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - marginX, pageHeight - 12, { align: 'right' });
    doc.text('AI Generated • AcademicX Slide Analyzer Study Guide', marginX, pageHeight - 12);
  };

  const checkPageSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = 25;
    }
  };

  // --- Draw First Page Title Area ---
  // Background card for Title Box
  doc.setFillColor(248, 250, 252); // soft slate background
  doc.rect(marginX, y, contentWidth, 38, 'F');
  
  // Left border bar for visual balance
  doc.setFillColor(14, 165, 233); // Cyan-500
  doc.rect(marginX, y, 2.5, 38, 'F');

  // Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('AI Study Analyzer Notes', marginX + 6, y + 10);

  // Subtitle
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Topic: ${title}`, marginX + 6, y + 17);

  // Metadata block coordinates
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(14, 165, 233); // Cyan-600
  doc.text('SOURCE SLIDES:', marginX + 6, y + 25);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  
  const sourceText = fileNames.length > 0 ? fileNames.join(', ') : 'Uploaded Material';
  const sourceTextLines = doc.splitTextToSize(sourceText, contentWidth - 36);
  doc.text(sourceTextLines, marginX + 32, y + 25);

  const metaOffset = Math.max(1, sourceTextLines.length) * 3.5;
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(14, 165, 233);
  doc.text('GENERATED ON:', marginX + 6, y + 25 + metaOffset);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(new Date().toLocaleDateString('en-US', { dateStyle: 'long' }), marginX + 32, y + 25 + metaOffset);

  y += 48; // Space after title block

  // --- Parse Markdown Content into PDF rows ---
  const rawLines = rawMarkdown.split('\n');

  rawLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      y += 4;
      return;
    }

    // Checking heading levels # and ##
    if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
      const isH1 = trimmed.startsWith('# ');
      const cleanText = trimmed.replace(/^#{1,2}\s+/, '');
      const fontSize = isH1 ? 14 : 11;
      const leadingGap = isH1 ? 10 : 8;

      checkPageSpace(leadingGap + 10);

      y += isH1 ? 5 : 3;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(fontSize);
      doc.setTextColor(15, 23, 42); // slate-900

      const wrapped = doc.splitTextToSize(cleanText, contentWidth);
      
      // Draw standard underline accent for H1
      if (isH1) {
        doc.setFillColor(224, 242, 254); // cyan-100
        doc.rect(marginX, y + 5, contentWidth, 0.4, 'F');
      }

      doc.text(wrapped, marginX, y + 4);
      y += (wrapped.length * (fontSize * 0.45)) + 6;

    } else if (trimmed.startsWith('### ')) {
      // Subheading ###
      const cleanText = trimmed.replace(/^###\s+/, '');
      checkPageSpace(12);

      y += 2;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59); // slate-800
      
      const wrapped = doc.splitTextToSize(cleanText, contentWidth);
      doc.text(wrapped, marginX, y + 2);
      y += (wrapped.length * 4.5) + 3;

    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      // List item
      const cleanText = trimmed.replace(/^[\-\*\•]\s+/, '');
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85); // slate-700

      const indent = 6;
      // Strip markdown bold wrappers inside items
      const stripText = cleanText.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
      const wrapped = doc.splitTextToSize(stripText, contentWidth - indent);
      
      checkPageSpace((wrapped.length * 4.5) + 4);

      // Cyan circular bullet
      doc.setFillColor(14, 165, 233);
      doc.circle(marginX + 1.8, y + 1.2, 0.7, 'F');

      wrapped.forEach((textLine: string, idx: number) => {
        doc.text(textLine, marginX + indent, y + (idx * 4.5));
      });
      y += (wrapped.length * 4.5) + 1.5;

    } else if (/^\d+\.\s+/.test(trimmed)) {
      // Numbered List Items
      const match = trimmed.match(/^(\d+\.)\s+(.*)/);
      const numLabel = match ? match[1] : '•';
      const cleanText = match ? match[2] : trimmed;

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);

      const indent = 7;
      const stripText = cleanText.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
      const wrapped = doc.splitTextToSize(stripText, contentWidth - indent);

      checkPageSpace((wrapped.length * 4.5) + 4);

      // Render the item index number elegantly in blue bold
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(14, 165, 233);
      doc.text(numLabel, marginX, y);

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      wrapped.forEach((textLine: string, idx: number) => {
        doc.text(textLine, marginX + indent, y + (idx * 4.5));
      });
      y += (wrapped.length * 4.5) + 1.5;

    } else {
      // Standard descriptive paragraphs
      const stripText = trimmed.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105); // slate-600

      const wrapped = doc.splitTextToSize(stripText, contentWidth);

      checkPageSpace((wrapped.length * 4.5) + 4);

      wrapped.forEach((textLine: string, idx: number) => {
        doc.text(textLine, marginX, y + (idx * 4.5));
      });
      y += (wrapped.length * 4.5) + 2;
    }
  });

  // Stamp decorations retrospectively on all pages to ensure "1 of N" matches accurately
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageDecorations(i, totalPages);
  }

  // Export PDF
  const dateStr = new Date().toISOString().split('T')[0];
  const safeFilename = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  doc.save(`StudyNotes_${safeFilename || 'guide'}_${dateStr}.pdf`);
}
