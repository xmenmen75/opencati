import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function roundTo9(num: number) {
  return Math.round(num * 1e9) / 1e9;
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting celebration tip distribution job...');
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const eligibleBroadcasts = await prisma.cardBroadcast.findMany({
      where: {
        only_celebrate: true,
        tip_cati: {
          gt: 0 
        },
        tip_distributed: false,
        createdAt: {
          lte: oneHourAgo
        },
      },
      include: {
        userCard: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { id: 'asc' }
    });
    console.log(`[CRON] Found ${eligibleBroadcasts.length} eligible celebration broadcasts`);

    let totalDistributions = 0;
    let totalTipsDistributed = BigInt(0);

    for (const broadcast of eligibleBroadcasts) {
      try {
        console.log(`[CRON] Processing broadcast ${broadcast.id}...`);
        const oneHourAfter = new Date(broadcast.createdAt.getTime() + 60 * 60 * 1000);

        // Find all threads created on this broadcast within 1 hour, not by the owner
        const threads = await prisma.thread.findMany({
          where: {
            broadcastId: broadcast.id,
            createdAt: {
              gte: broadcast.createdAt,
              lte: oneHourAfter,
            },
            senderId: {
              not: broadcast.userCard.user.id
            },
            reaction: {
              not: null
            }
          },
          include: {
            sender: true
          }
        });

        const broadcastOwnerId = broadcast.userCard.user.id;

        // Get unique sender IDs
        const uniqueSenders = Array.from(new Set(threads.map(t => t.sender.id)));

        if (uniqueSenders.length === 0) {
          console.log(`[CRON] No eligible threads for broadcast ${broadcast.id} (no thread created by non-owner within 1 hour)`);
          // Mark as distributed even with no recipient to avoid reprocessing
          await prisma.cardBroadcast.update({
            where: { id: broadcast.id },
            data: { tip_distributed: true }
          });
          continue;
        }

        // Distribute the tip equally among all unique thread creators
  // eighth digit after decimal, store as atomic units (integer)
  const tipPerUser = Math.floor((Number(broadcast.tip_cati) / uniqueSenders.length) * 1e8) / 1e8;
  const tipPerUserAtomic = Math.floor((Number(broadcast.tip_cati) / uniqueSenders.length) * 1e8); // integer atomic units
  const tipPerUserBigInt = BigInt(tipPerUserAtomic);

        console.log(`[CRON] Distributing ${tipPerUser} CATI to each of ${uniqueSenders.length} users for broadcast ${broadcast.id}`);

        // Use Prisma transaction to ensure atomicity
        const distributionResult = await prisma.$transaction(async (tx) => {
          const distributions = [];
          for (const senderId of uniqueSenders) {
            // Final safety check: never give tips to broadcast owner
            if (senderId === broadcastOwnerId) {
              console.error(`[CRON] SAFETY CHECK FAILED: Almost gave tip to broadcast owner ${broadcastOwnerId} for broadcast ${broadcast.id}`);
              continue;
            }

            // Update user balance within transaction
            await tx.user.update({
              where: { id: senderId },
              data: {
                catiBalance: {
                  increment: tipPerUserBigInt
                }
              }
            });

            // Create transaction record within transaction
            const transaction = await tx.catiTransaction.create({
              data: {
                userId: senderId,
                type: 'CELEBRATION_TIP',
                amount: tipPerUserBigInt,
                description: `Celebration engagement reward from broadcast ${broadcast.id}`,
                referenceId: broadcast.id,
                source: 'OFFCHAIN'
              }
            });

            // Get sender nickname for reporting
            const senderThread = threads.find(t => t.sender.id === senderId);
            distributions.push({
              userId: senderId.toString(),
              userNickname: senderThread?.sender.userNickname || '',
              amount: tipPerUser,
              transactionId: transaction.id.toString()
            });
          }

          // Mark as distributed
          await tx.cardBroadcast.update({
            where: { id: broadcast.id },
            data: { tip_distributed: true }
          });

          return distributions;
        });

        // Update counters only after successful transaction
        totalTipsDistributed += tipPerUserBigInt * BigInt(distributionResult.length);
        totalDistributions += distributionResult.length;

        console.log(`[CRON] Successfully distributed tip for broadcast ${broadcast.id}:`, {
          recipientCount: distributionResult.length,
          tipPerUser,
          totalForBroadcast: tipPerUser * distributionResult.length
        });

      } catch (error) {
        console.error(`[CRON] Error processing broadcast ${broadcast.id}:`, error);
        // Don't mark as distributed if there was an error - will retry next time
        // The transaction will have been rolled back automatically
        continue;
      }
    }

    const result = {
      success: true,
      processedAt: new Date().toISOString(),
      eligibleBroadcasts: eligibleBroadcasts.length,
      totalDistributions,
      totalTipsDistributed: totalTipsDistributed.toString(),
      summary: `Processed ${eligibleBroadcasts.length} celebration broadcasts, distributed ${totalTipsDistributed.toString()} CATI to ${totalDistributions} users`
    };

    console.log('[CRON] Celebration tip distribution completed:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[CRON] Error in celebration tip distribution:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to distribute celebration tips',
        details: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}