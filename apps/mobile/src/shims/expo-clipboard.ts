import Clipboard from '@react-native-clipboard/clipboard';

export async function setStringAsync(text: string): Promise<boolean> {
  Clipboard.setString(text);
  return true;
}

export async function getStringAsync(): Promise<string> {
  return await Clipboard.getString();
}

export const setString = (text: string) => {
  Clipboard.setString(text);
};

export const getString = async () => {
  return await Clipboard.getString();
};

export default {
  setStringAsync,
  getStringAsync,
  setString,
  getString,
};
