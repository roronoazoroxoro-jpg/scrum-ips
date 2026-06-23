import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

export interface ColumnaExportacion {
  encabezado: string;
  clave: string;
  formatear?: (valor: unknown, fila: Record<string, unknown>) => string;
}

export interface OpcionesExportacion {
  titulo: string;
  nombreArchivo: string;
  columnas: ColumnaExportacion[];
  filas: Record<string, unknown>[];
}

export type FormatoExportacion = 'excel' | 'pdf' | 'word';

function obtenerValorCelda(columna: ColumnaExportacion, fila: Record<string, unknown>): string {
  const valor = fila[columna.clave];
  if (columna.formatear) return columna.formatear(valor, fila);
  if (valor === null || valor === undefined) return '';
  return String(valor);
}

function construirMatriz(opciones: OpcionesExportacion): string[][] {
  const encabezados = opciones.columnas.map((c) => c.encabezado);
  const cuerpo = opciones.filas.map((fila) =>
    opciones.columnas.map((columna) => obtenerValorCelda(columna, fila))
  );
  return [encabezados, ...cuerpo];
}

function nombreSeguro(nombre: string): string {
  return nombre.replace(/[<>:"/\\|?*]+/g, '-').trim() || 'exportacion';
}

function exportarExcel(opciones: OpcionesExportacion) {
  const hoja = XLSX.utils.aoa_to_sheet(construirMatriz(opciones));
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Datos');
  const buffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });
  saveAs(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${nombreSeguro(opciones.nombreArchivo)}.xlsx`
  );
}

function exportarPdf(opciones: OpcionesExportacion) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(opciones.titulo, 40, 36);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 40, 52);

  const matriz = construirMatriz(opciones);
  autoTable(doc, {
    head: [matriz[0]],
    body: matriz.slice(1),
    startY: 64,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [30, 64, 175] },
    margin: { left: 40, right: 40 },
  });

  doc.save(`${nombreSeguro(opciones.nombreArchivo)}.pdf`);
}

async function exportarWord(opciones: OpcionesExportacion) {
  const matriz = construirMatriz(opciones);
  const filasTabla = matriz.map((fila, indice) =>
    new TableRow({
      children: fila.map(
        (texto) =>
          new TableCell({
            width: { size: 100 / opciones.columnas.length, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: texto,
                    bold: indice === 0,
                    size: indice === 0 ? 20 : 18,
                  }),
                ],
              }),
            ],
          })
      ),
    })
  );

  const documento = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: opciones.titulo,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generado: ${new Date().toLocaleString('es-AR')}`,
                size: 18,
                color: '666666',
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: filasTabla,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(documento);
  saveAs(blob, `${nombreSeguro(opciones.nombreArchivo)}.docx`);
}

export async function exportarDatos(formato: FormatoExportacion, opciones: OpcionesExportacion) {
  if (opciones.filas.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  if (formato === 'excel') {
    exportarExcel(opciones);
    return;
  }
  if (formato === 'pdf') {
    exportarPdf(opciones);
    return;
  }
  await exportarWord(opciones);
}
