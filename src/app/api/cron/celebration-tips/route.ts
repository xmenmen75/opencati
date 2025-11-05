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
        
        // Calculate the 1-hour window from broadcast creation
        const broadcastCreatedAt = broadcast.createdAt;
        const oneHourAfterBroadcast = new Date(broadcastCreatedAt.getTime() + 60 * 60 * 1000);
        const broadcastOwnerId = broadcast.userCard.user.id;

        console.log(`[CRON] Checking threads for broadcast ${broadcast.id} created between ${broadcastCreatedAt.toISOString()} and ${oneHourAfterBroadcast.toISOString()}`);

        // Find all threads created within 1 hour of broadcast with reactions
        const eligibleThreads = await prisma.thread.findMany({
          where: {
            broadcastId: broadcast.id,
            createdAt: {
              gte: broadcastCreatedAt,
              lte: oneHourAfterBroadcast,
            },
            senderId: {
              not: broadcastOwnerId // Exclude broadcast owner
            },
            reaction: {
              not: null // Must have a reaction
            }
          },
          include: {
            sender: true
          },
          orderBy: {
            createdAt: 'asc' // Order by creation time to see the timeline
          }
        });

        console.log(`[CRON] Found ${eligibleThreads.length} eligible threads for broadcast ${broadcast.id}`);

        if (eligibleThreads.length === 0) {
          console.log(`[CRON] No eligible threads for broadcast ${broadcast.id} (no threads with reactions within 1 hour by non-owner)`);
          // Mark as distributed even with no recipients to avoid reprocessing
          await prisma.cardBroadcast.update({
            where: { id: broadcast.id },
            data: { tip_distributed: true }
          });
          continue;
        }

        // Get unique sender IDs - only count each user once per broadcast
        const uniqueSenderIds = Array.from(new Set(eligibleThreads.map(thread => thread.senderId)));
        
        console.log(`[CRON] Unique users who created threads with reactions: ${uniqueSenderIds.length}`);

        // Calculate tip per unique user (using atomic units for precision)
        const tipPerUserAtomic = Math.floor((Number(broadcast.tip_cati) / uniqueSenderIds.length) * 1e8);
        const tipPerUserBigInt = BigInt(tipPerUserAtomic);
        const tipPerUserDisplay = tipPerUserAtomic / 1e8;

        console.log(`[CRON] Distributing ${tipPerUserDisplay} CATI (${tipPerUserAtomic} atomic units) to each of ${uniqueSenderIds.length} unique users for broadcast ${broadcast.id}`);

        // Use Prisma transaction to ensure atomicity
        const distributionResult = await prisma.$transaction(async (tx) => {
          const distributions = [];
          
          for (const senderId of uniqueSenderIds) {
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

            // Get sender info for reporting (find first thread by this user)
            const userThread = eligibleThreads.find(t => t.senderId === senderId);
            distributions.push({
              userId: senderId.toString(),
              userNickname: userThread?.sender.userNickname || '',
              amount: tipPerUserDisplay,
              threadCount: eligibleThreads.filter(t => t.senderId === senderId).length,
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
          uniqueRecipients: distributionResult.length,
          tipPerUser: tipPerUserDisplay,
          totalForBroadcast: tipPerUserDisplay * distributionResult.length,
          distributions: distributionResult.map(d => ({
            user: d.userNickname,
            threadCount: d.threadCount,
            amount: d.amount
          }))
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