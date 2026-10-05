import { useQuery } from '@tanstack/react-query';
import { appReleaseApi, IAppReleaseData } from '../services/api/appRelease.api';

export const LATEST_RELEASE_QUERY_KEY = ['appRelease', 'latest'];

const FALLBACK_RELEASE: IAppReleaseData = {
  platform: 'android',
  version: '2.1.0',
  buildNumber: 21,
  downloadUrl:
    'https://github.com/wakeru-app/releases/releases/latest/download/TripSplit.apk',
  displayLabel: 'TripSplit Android APK (v2.1.0)',
  releaseNotes:
    'Performance enhancements, multi-currency live FX engine, and instant 1-tap settlement.',
  isActive: true,
  releasedAt: new Date().toISOString(),
};

/**
 * Hook to retrieve the active app download configuration.
 * Single authoritative source across Hero, Download Page, and Notifications.
 */
export function useAppRelease(platform: string = 'android') {
  const query = useQuery({
    queryKey: [...LATEST_RELEASE_QUERY_KEY, platform],
    queryFn: async () => {
      try {
        const res = await appReleaseApi.getLatestRelease(platform);
        return res?.data || FALLBACK_RELEASE;
      } catch {
        return FALLBACK_RELEASE;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 30 * 60 * 1000,
  });

  const release = query.data || FALLBACK_RELEASE;

  return {
    release,
    downloadUrl: release.downloadUrl,
    version: release.version,
    displayLabel: release.displayLabel || `TripSplit (${release.version})`,
    releaseNotes: release.releaseNotes,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
