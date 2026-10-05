import apiClient, { ApiResponse } from './client';

export interface IAppReleaseData {
  _id?: string;
  id?: string;
  platform: 'android' | 'ios' | 'web';
  version: string;
  buildNumber?: number;
  downloadUrl: string;
  displayLabel?: string;
  releaseNotes?: string;
  isActive: boolean;
  forceUpdate?: boolean;
  minSupportedVersion?: string;
  releasedAt: string;
}

export const appReleaseApi = {
  /**
   * Fetch the active latest release for download CTA (public, no auth required)
   */
  getLatestRelease: async (
    platform: string = 'android',
  ): Promise<ApiResponse<IAppReleaseData>> => {
    return apiClient.get('/app-release/latest', {
      params: { platform },
    });
  },

  /**
   * Admin: List all releases
   */
  adminListReleases: async (): Promise<ApiResponse<IAppReleaseData[]>> => {
    return apiClient.get('/app-release/admin/all');
  },

  /**
   * Admin: Publish new release and optionally trigger broadcast notification
   */
  adminPublishRelease: async (payload: {
    platform?: 'android' | 'ios' | 'web';
    version: string;
    buildNumber?: number;
    downloadUrl: string;
    displayLabel?: string;
    releaseNotes?: string;
    isActive?: boolean;
    forceUpdate?: boolean;
    broadcastNotification?: boolean;
  }): Promise<ApiResponse<IAppReleaseData>> => {
    return apiClient.post('/app-release/admin/publish', payload);
  },
};
