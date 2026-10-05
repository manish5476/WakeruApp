import Share from 'react-native-share';

export async function isAvailableAsync(): Promise<boolean> {
  return true;
}

export async function shareAsync(
  url: string,
  options?: { dialogTitle?: string; mimeType?: string; UTI?: string },
): Promise<void> {
  try {
    const isFile = url.startsWith('file://') || url.startsWith('/');
    const shareUrl =
      isFile && !url.startsWith('file://') ? `file://${url}` : url;

    await Share.open({
      url: shareUrl,
      title: options?.dialogTitle,
      type: options?.mimeType,
      failOnCancel: false,
    });
  } catch (error) {
    console.log('Error sharing:', error);
  }
}

export default {
  isAvailableAsync,
  shareAsync,
};
