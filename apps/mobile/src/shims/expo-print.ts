export async function printAsync(_options?: any) {
  return;
}

export async function printToFileAsync(_options?: any) {
  return { uri: '', numberOfPages: 1 };
}

export default {
  printAsync,
  printToFileAsync,
};
