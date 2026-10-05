// src/services/ocr/ocr.native.ts
import { IOcrService } from './ocr.interface';
import { OcrResult, OcrBlock } from './ocr.types';

export class NativeOcrService implements IOcrService {
  isAvailable(): boolean {
    return true;
  }

  async recognizeText(imageUri: string): Promise<OcrResult> {
    const startTime = Date.now();
    try {
      // Dynamic import to prevent bundler hoisting issues
      const mlkitOcr = require('rn-mlkit-ocr');
      const recognizeFn =
        mlkitOcr.recognizeText || mlkitOcr.default?.recognizeText;

      if (!recognizeFn) {
        throw new Error('ML Kit recognizeText function not found');
      }

      // Use bundled Latin model for instant offline recognition
      const nativeResult = await recognizeFn(imageUri, 'latin');
      const processingTimeMs = Date.now() - startTime;

      const blocks: OcrBlock[] = (nativeResult.blocks || []).map((b: any) => ({
        text: b.text || '',
        frame: b.frame
          ? {
              x: b.frame.x ?? 0,
              y: b.frame.y ?? 0,
              width: b.frame.width ?? 0,
              height: b.frame.height ?? 0,
            }
          : undefined,
        lines: (b.lines || []).map((l: any) => ({
          text: l.text || '',
          frame: l.frame
            ? {
                x: l.frame.x ?? 0,
                y: l.frame.y ?? 0,
                width: l.frame.width ?? 0,
                height: l.frame.height ?? 0,
              }
            : undefined,
          elements: (l.elements || []).map((el: any) => ({
            text: el.text || '',
            frame: el.frame
              ? {
                  x: el.frame.x ?? 0,
                  y: el.frame.y ?? 0,
                  width: el.frame.width ?? 0,
                  height: el.frame.height ?? 0,
                }
              : undefined,
          })),
        })),
      }));

      const fullText = nativeResult.text || blocks.map(b => b.text).join('\n');

      return {
        text: fullText,
        blocks,
        isAvailable: true,
        provider: 'mlkit-latin',
        processingTimeMs,
      };
    } catch (error: any) {
      console.warn(
        '[NativeOcrService] Recognition failed:',
        error?.message || error,
      );
      return {
        text: '',
        blocks: [],
        isAvailable: false,
        provider: 'mlkit-latin',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }
}

export const ocrService = new NativeOcrService();
