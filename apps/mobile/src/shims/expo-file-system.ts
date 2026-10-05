import * as RNFS from 'react-native-fs';

export const documentDirectory = RNFS.DocumentDirectoryPath + '/';
export const cacheDirectory = RNFS.CachesDirectoryPath + '/';

export async function downloadAsync(url: string, fileUri: string) {
  const cleanUri = fileUri.replace('file://', '');
  const result = await RNFS.downloadFile({
    fromUrl: url,
    toFile: cleanUri,
  }).promise;

  return { uri: fileUri, status: result.statusCode };
}

export async function writeAsStringAsync(
  uri: string,
  contents: string,
  options?: { encoding?: string },
) {
  const cleanUri = uri.replace('file://', '');
  const encoding = options?.encoding === 'base64' ? 'base64' : 'utf8';
  await RNFS.writeFile(cleanUri, contents, encoding);
}

export async function readAsStringAsync(
  uri: string,
  options?: { encoding?: string },
) {
  const cleanUri = uri.replace('file://', '');
  const encoding = options?.encoding === 'base64' ? 'base64' : 'utf8';
  return await RNFS.readFile(cleanUri, encoding);
}

export async function getInfoAsync(fileUri: string) {
  const cleanUri = fileUri.replace('file://', '');
  const exists = await RNFS.exists(cleanUri);
  if (!exists) {
    return { exists: false, isDirectory: false };
  }
  const stat = await RNFS.stat(cleanUri);
  return {
    exists: true,
    isDirectory: stat.isDirectory(),
    size: stat.size,
    uri: fileUri,
    modificationTime: new Date(stat.mtime || Date.now()).getTime(),
  };
}

export async function copyAsync(options: { from: string; to: string }) {
  const fromUri = options.from.replace('file://', '');
  const toUri = options.to.replace('file://', '');
  await RNFS.copyFile(fromUri, toUri);
}

export async function deleteAsync(
  fileUri: string,
  options?: { idempotent?: boolean },
) {
  const cleanUri = fileUri.replace('file://', '');
  try {
    await RNFS.unlink(cleanUri);
  } catch (err: any) {
    if (!options?.idempotent) throw err;
  }
}

export class File {
  uri: string;
  constructor(dirOrUri?: string, name?: string) {
    this.uri = dirOrUri && name ? `${dirOrUri}/${name}` : dirOrUri || '';
  }
  async write(content: string, options?: any): Promise<void> {
    await writeAsStringAsync(this.uri, content, options);
  }
}

export const Paths = {
  document: documentDirectory,
  cache: cacheDirectory,
};

export default {
  documentDirectory,
  cacheDirectory,
  downloadAsync,
  writeAsStringAsync,
  readAsStringAsync,
  getInfoAsync,
  copyAsync,
  deleteAsync,
  File,
  Paths,
};
