import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addComputedStatusToSeasons, getCurrentSeason } from '@/lib/season-utils';

export async function GET() {
  try {
    // Get all seasons to find current one (active or most recently ended)
    const allSeasons = await prisma.season.findMany({
      orderBy: {
        startDate: 'desc',
      },
    });

    // Add computed status to all seasons
    const seasonsWithComputedStatus = addComputedStatusToSeasons(
      allSeasons.map(season => ({
        id: season.id.toString(),
        name: season.name,
        slogan: season.slogan,
        bidPoolAmount: season.bidPoolAmount.toString(),
        additionalTotalPool: season.additionalTotalPool.toString(),
        startDate: season.startDate.toISOString(),
        endDate: season.endDate.toISOString(),
        status: season.status,
        createdAt: season.createdAt.toISOString(),
      }))
    );

    // Find currently active seasons
    const activeSeasons = seasonsWithComputedStatus.filter(s => s.status === 'ACTIVE');
    
    // If there are active seasons, return them (maintain backward compatibility)
    if (activeSeasons.length > 0) {
      return NextResponse.json(activeSeasons);
    }

    // If no active seasons, return the most recently ended season for display
    const currentSeason = getCurrentSeason(seasonsWithComputedStatus);
    return NextResponse.json(currentSeason ? [currentSeason] : []);
    
  } catch (error) {
    console.error('Error fetching current seasons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
