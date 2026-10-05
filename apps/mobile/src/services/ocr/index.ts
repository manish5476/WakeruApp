// src/services/ocr/index.ts
import { Platform } from 'react-native';
import { IOcrService } from './ocr.interface';

export * from './ocr.types';
export * from './ocr.interface';

let serviceInstance: IOcrService | null = null;

export function getOcrService(): IOcrService {
  if (!serviceInstance) {
    if (Platform.OS === 'web') {
      const { WebOcrService } = require('./ocr.web');
      serviceInstance = new WebOcrService();
    } else {
      const { NativeOcrService } = require('./ocr.native');
      serviceInstance = new NativeOcrService();
    }
  }
  return serviceInstance!;
}

export const ocrService = {
  recognizeText: (imageUri: string) => getOcrService().recognizeText(imageUri),
  isAvailable: () => getOcrService().isAvailable(),
};
