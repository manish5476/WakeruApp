import { generatePDF } from 'react-native-html-to-pdf';
import { print } from 'react-native-print';

export async function printAsync(options: { html?: string; uri?: string }) {
  if (options.html) {
    await print({ html: options.html });
  } else if (options.uri) {
    await print({ filePath: options.uri });
  }
}

export async function printToFileAsync(options: {
  html?: string;
  base64?: boolean;
  width?: number;
  height?: number;
}) {
  if (options.html) {
    const file = await generatePDF({
      html: options.html,
      directory: 'Documents',
      fileName: `TripSplit_${Date.now()}`,
      base64: options.base64 || false,
    });
    return {
      uri: `file://${file.filePath}`,
      base64: file.base64,
      numberOfPages: 1, // react-native-html-to-pdf doesn't return page count
    };
  }
  return { uri: '', numberOfPages: 1 };
}

export default {
  printAsync,
  printToFileAsync,
};
