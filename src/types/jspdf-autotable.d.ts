declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface AutoTableOptions {
    head?: any[][];
    body?: any[][];
    startY?: number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    styles?: {
      fontSize?: number;
      cellPadding?: number;
      overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
      cellWidth?: 'auto' | 'wrap' | number;
      minCellHeight?: number;
      minCellWidth?: number;
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
      fillColor?: number | [number, number, number];
      textColor?: number | [number, number, number];
      fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
    };
    headStyles?: any;
    bodyStyles?: any;
    alternateRowStyles?: any;
    columnStyles?: any;
    theme?: 'striped' | 'grid' | 'plain';
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    tableWidth?: 'auto' | 'wrap' | number;
  }

  function autoTable(doc: jsPDF, options: AutoTableOptions): void;
  export default autoTable;
}
