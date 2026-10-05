// src/services/ocr/ocr.interface.ts
import { OcrResult } from './ocr.types';

export interface IOcrService {
  /**
   * Recognizes text from a local image URI.
   * Returns hierarchical text blocks, lines, elements, and coordinates.
   */
  recognizeText(imageUri: string): Promise<OcrResult>;

  /**
   * Returns whether on-device OCR is supported and ready on current platform.
   */
  isAvailable(): boolean;
}
