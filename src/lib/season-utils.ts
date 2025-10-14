import type { SeasonStatus } from '@/types';

/**
 * Compute the actual season status based on dates and distribution state
 * This overrides the stored status except for DISTRIBUTED which must be manually set
 */
export function computeSeasonStatus(season: {
  startDate: string | Date;
  endDate: string | Date;
  status: string;
}): SeasonStatus {
  const now = new Date();
  const startDate = new Date(season.startDate);
  const endDate = new Date(season.endDate);
  
  // DISTRIBUTED status is manually set and takes precedence
  if (season.status === 'DISTRIBUTED') {
    return 'DISTRIBUTED';
  }
  
  // Compute status based on current time vs season dates
  if (now < startDate) {
    return 'UPCOMING';
  }
  
  if (now > endDate) {
    return 'ENDED';
  }
  
  return 'ACTIVE';
}

/**
 * Add computed status to a season object
 */
export function addComputedStatus<T extends { startDate: string | Date; endDate: string | Date; status: string }>(
  season: T
): T & { status: SeasonStatus } {
  return {
    ...season,
    status: computeSeasonStatus(season)
  };
}

/**
 * Add computed status to an array of seasons
 */
export function addComputedStatusToSeasons<T extends { startDate: string | Date; endDate: string | Date; status: string }>(
  seasons: T[]
): (T & { status: SeasonStatus })[] {
  return seasons.map(addComputedStatus);
}

/**
 * Get the current season (active or most recently ended)
 * This is used when there's no active season to show the last ended season's data
 */
export function getCurrentSeason<T extends { startDate: string | Date; endDate: string | Date; status: string; createdAt: string | Date }>(
  seasons: T[]
): (T & { status: SeasonStatus }) | null {
  const seasonsWithStatus = addComputedStatusToSeasons(seasons);
  
  // First, try to find an active season
  const activeSeason = seasonsWithStatus.find(s => s.status === 'ACTIVE');
  if (activeSeason) {
    return activeSeason;
  }
  
  // If no active season, find the most recently ended season
  const endedSeasons = seasonsWithStatus
    .filter(s => s.status === 'ENDED' || s.status === 'DISTRIBUTED')
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  
  return endedSeasons[0] || null;
}

/**
 * Check if a season is currently active (can open packs)
 */
export function isSeasonActive(season: {
  startDate: string | Date;
  endDate: string | Date;
  status: string;
}): boolean {
  return computeSeasonStatus(season) === 'ACTIVE';
}

/**
 * Check if pack opening should be allowed
 * Only allow pack opening during active seasons
 */
export function canOpenPacks(seasons: Array<{
  startDate: string | Date;
  endDate: string | Date;
  status: string;
}>): boolean {
  return seasons.some(isSeasonActive);
}
