import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSeason, addComputedStatusToSeasons } from '@/lib/season-utils';

/**
 * Get the current season for display purposes
 * Returns active season if available, otherwise most recently ended season
 */
export async function GET() {
  try {
    // Get all seasons to determine current one
    const allSeasons = await prisma.season.findMany({
      orderBy: {
        startDate: 'desc',
      },
    });

    if (allSeasons.length === 0) {
      return NextResponse.json({
        currentSeason: null,
        canOpenPacks: false,
        message: 'No seasons found'
      });
    }

    // Transform to response format with computed status
    const seasonsForComputation = allSeasons.map(season => ({
      id: season.id.toString(),
      name: season.name,
      slogan: season.slogan,
      bidPoolAmount: season.bidPoolAmount.toString(),
      additionalTotalPool: season.additionalTotalPool.toString(),
      startDate: season.startDate.toISOString(),
      endDate: season.endDate.toISOString(),
      status: season.status,
      createdAt: season.createdAt.toISOString(),
    }));

    // Get current season (active or most recently ended)
    const currentSeason = getCurrentSeason(seasonsForComputation);
    
    // Check if pack opening is allowed (only during active seasons)
    const canOpenPacks = currentSeason?.status === 'ACTIVE';

    return NextResponse.json({
      currentSeason,
      canOpenPacks,
      message: currentSeason 
        ? `Current season: ${currentSeason.name} (${currentSeason.status})`
        : 'No current season available'
    });
    
  } catch (error) {
    console.error('Error fetching current season:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
