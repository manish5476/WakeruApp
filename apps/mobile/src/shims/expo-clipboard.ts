let _clipboardContent = '';

export async function setStringAsync(text: string): Promise<boolean> {
  _clipboardContent = text;
  return true;
}

export async function getStringAsync(): Promise<string> {
  return _clipboardContent;
}

export const setString = (text: string) => {
  _clipboardContent = text;
};

export const getString = () => _clipboardContent;

export default {
  setStringAsync,
  getStringAsync,
  setString,
  getString,
};
