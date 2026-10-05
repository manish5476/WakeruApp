// src/services/ocr/ocr.web.ts
import { IOcrService } from './ocr.interface';
import { OcrResult } from './ocr.types';

export class WebOcrService implements IOcrService {
  isAvailable(): boolean {
    return false;
  }

  async recognizeText(_imageUri: string): Promise<OcrResult> {
    return {
      text: '',
      blocks: [],
      isAvailable: false,
      provider: 'web-fallback',
      processingTimeMs: 0,
    };
  }
}

export const ocrService = new WebOcrService();
