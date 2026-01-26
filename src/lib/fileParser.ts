import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import type { AllowedFileType } from '../types/attachment';

// Set up PDF.js worker for Vite
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function parseFile(file: File, fileType: AllowedFileType): Promise<string> {
  switch (fileType) {
    case 'pdf':
      return parsePDF(file);
    case 'docx':
    case 'doc':
      return parseWord(file);
    case 'txt':
      return parseTxt(file);
    case 'xls':
    case 'xlsx':
      return parseExcel(file);
    default:
      throw new Error(`Desteklenmeyen dosya tipi: ${fileType}`);
  }
}

async function parsePDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n\n');
}

async function parseWord(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function parseTxt(file: File): Promise<string> {
  return file.text();
}

async function parseExcel(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const textParts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    textParts.push(`--- ${sheetName} ---\n${csv}`);
  }

  return textParts.join('\n\n');
}
