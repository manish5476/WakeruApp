export const documentDirectory = '';
export const cacheDirectory = '';

export async function downloadAsync(url: string, fileUri: string) {
  return { uri: fileUri, status: 200 };
}

export async function writeAsStringAsync(_uri: string, _contents: string) {
  return;
}

export async function getInfoAsync(fileUri: string) {
  return {
    exists: true,
    isDirectory: false,
    size: 1024,
    uri: fileUri,
    modificationTime: Date.now(),
  };
}

export async function copyAsync(_options: { from: string; to: string }) {
  return;
}

export class File {
  uri: string;
  constructor(dirOrUri?: string, name?: string) {
    this.uri = dirOrUri && name ? `${dirOrUri}/${name}` : dirOrUri || '';
  }
  write(_content: string, _options?: any): void {}
}

export const Paths = {
  document: '',
  cache: '',
};

export default {
  documentDirectory,
  cacheDirectory,
  downloadAsync,
  writeAsStringAsync,
  getInfoAsync,
  copyAsync,
  File,
  Paths,
};
