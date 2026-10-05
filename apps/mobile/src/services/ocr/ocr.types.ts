// src/services/ocr/ocr.types.ts

export interface OcrBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrElement {
  text: string;
  frame?: OcrBoundingBox;
  confidence?: number;
}

export interface OcrLine {
  text: string;
  frame?: OcrBoundingBox;
  elements: OcrElement[];
}

export interface OcrBlock {
  text: string;
  frame?: OcrBoundingBox;
  lines: OcrLine[];
}

export interface OcrResult {
  text: string;
  blocks: OcrBlock[];
  isAvailable: boolean;
  provider: 'mlkit-latin' | 'web-fallback' | 'unsupported';
  processingTimeMs?: number;
}
