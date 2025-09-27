import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const activeSeasons = await prisma.season.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    const response = activeSeasons.map(season => ({
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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching active seasons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
