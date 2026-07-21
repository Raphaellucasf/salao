declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  type CellInput = string | number | boolean | null;
  type StyleOptions = Record<string, string | number | boolean | number[] | undefined>;

  interface AutoTableOptions {
    head?: CellInput[][];
    body?: CellInput[][];
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
    headStyles?: StyleOptions;
    bodyStyles?: StyleOptions;
    alternateRowStyles?: StyleOptions;
    columnStyles?: Record<string | number, StyleOptions>;
    theme?: 'striped' | 'grid' | 'plain';
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    tableWidth?: 'auto' | 'wrap' | number;
  }

  function autoTable(doc: jsPDF, options: AutoTableOptions): void;
  export default autoTable;
}
