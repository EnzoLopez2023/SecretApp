// src/utils/version.ts
// Utility to get version information

export interface VersionInfo {
  version: string;
  build: number;
  timestamp: string;
  commit: string;
  branch: string;
  fullVersion: string;
}

export const getVersionInfo = async (): Promise<VersionInfo | null> => {
  try {
    const response = await fetch('/version.json');
    if (!response.ok) {
      throw new Error('Version info not found');
    }
    const versionData = await response.json();
    return {
      ...versionData,
      fullVersion: `${versionData.version}.${versionData.build}`
    };
  } catch (error) {
    console.warn('Could not load version information:', error);
    return null;
  }
};

export const formatVersionDisplay = (versionInfo: VersionInfo): string => {
  const date = new Date(versionInfo.timestamp);
  return `v${versionInfo.fullVersion} (${versionInfo.commit}) - ${date.toLocaleDateString()}`;
};