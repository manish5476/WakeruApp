import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

export enum MediaTypeOptions {
  All = 'mixed',
  Videos = 'video',
  Images = 'photo',
}

export async function requestMediaLibraryPermissionsAsync() {
  return { status: 'granted', granted: true };
}

export async function requestCameraPermissionsAsync() {
  return { status: 'granted', granted: true };
}

export async function launchImageLibraryAsync(options?: any) {
  const result = await launchImageLibrary({
    mediaType:
      options?.mediaTypes === MediaTypeOptions.Videos ? 'video' : 'photo',
    quality: options?.quality ?? 0.8,
    selectionLimit: options?.allowsMultipleSelection ? 0 : 1,
  });
  if (result.didCancel || !result.assets) {
    return { canceled: true, assets: [] };
  }
  return {
    canceled: false,
    assets: result.assets.map((a: any) => ({
      uri: a.uri || '',
      width: a.width,
      height: a.height,
      fileName: a.fileName,
      fileSize: a.fileSize,
      mimeType: a.type,
      base64: a.base64,
    })),
  };
}

export async function launchCameraAsync(options?: any) {
  const result = await launchCamera({
    mediaType:
      options?.mediaTypes === MediaTypeOptions.Videos ? 'video' : 'photo',
    quality: options?.quality ?? 0.8,
  });
  if (result.didCancel || !result.assets) {
    return { canceled: true, assets: [] };
  }
  return {
    canceled: false,
    assets: result.assets.map((a: any) => ({
      uri: a.uri || '',
      width: a.width,
      height: a.height,
      fileName: a.fileName,
      fileSize: a.fileSize,
      mimeType: a.type,
      base64: a.base64,
    })),
  };
}

export default {
  MediaTypeOptions,
  requestMediaLibraryPermissionsAsync,
  requestCameraPermissionsAsync,
  launchImageLibraryAsync,
  launchCameraAsync,
};
