import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import {
  request,
  check,
  PERMISSIONS,
  RESULTS,
  requestMultiple,
} from 'react-native-permissions';
import { Platform } from 'react-native';

export enum MediaTypeOptions {
  All = 'mixed',
  Videos = 'video',
  Images = 'photo',
}

export async function requestMediaLibraryPermissionsAsync() {
  if (Platform.OS === 'ios') {
    const status = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
    return {
      status: status === RESULTS.GRANTED ? 'granted' : 'denied',
      granted: status === RESULTS.GRANTED,
    };
  } else if (Platform.OS === 'android') {
    const version =
      typeof Platform.Version === 'string'
        ? parseInt(Platform.Version, 10)
        : Platform.Version;
    if (version >= 33) {
      const statuses = await requestMultiple([
        PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
        PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
      ]);
      const granted =
        statuses[PERMISSIONS.ANDROID.READ_MEDIA_IMAGES] === RESULTS.GRANTED;
      return { status: granted ? 'granted' : 'denied', granted };
    } else {
      const status = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      return {
        status: status === RESULTS.GRANTED ? 'granted' : 'denied',
        granted: status === RESULTS.GRANTED,
      };
    }
  }
  return { status: 'granted', granted: true };
}

export async function requestCameraPermissionsAsync() {
  const permission =
    Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
  const status = await request(permission);
  return {
    status: status === RESULTS.GRANTED ? 'granted' : 'denied',
    granted: status === RESULTS.GRANTED,
  };
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
