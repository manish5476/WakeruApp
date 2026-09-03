import { Share } from 'react-native';

export async function isAvailableAsync(): Promise<boolean> {
  return true;
}

export async function shareAsync(
  url: string,
  options?: { dialogTitle?: string; mimeType?: string; UTI?: string },
): Promise<void> {
  await Share.share({
    url,
    message: url,
    title: options?.dialogTitle,
  });
}

export default {
  isAvailableAsync,
  shareAsync,
};
