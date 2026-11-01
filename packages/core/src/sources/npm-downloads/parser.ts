// npm downloads parser - simple passthrough since API returns just a number

export interface DownloadsSignals {
  weeklyDownloads: number | null;
}

export function parseDownloads(downloads: number | null): DownloadsSignals {
  return {
    weeklyDownloads: downloads,
  };
}
