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

        // Get messages sent to this broadcast within the 1-hour window
        const broadcastMessages = await prisma.message.findMany({
          where: {
            broadcastId: broadcast.id,
            createdAt: {
              gte: broadcast.createdAt, 
              lte: oneHourAfter, 
            },
            reaction: {
              not: null
            },
            senderId: {
              not: broadcast.userCard.user.id 
            }
          },
          include: {
            sender: true,
          },
        });

        // Get unique message senders (excluding broadcast owner)
        const broadcastOwnerId = broadcast.userCard.user.id;
        const messageSenders = broadcastMessages
          .reduce((unique: any[], msg: any) => {
            // Double-check: ensure sender is not the broadcast owner
            if (msg.sender.id !== broadcastOwnerId && !unique.find(u => u.id === msg.sender.id)) {
              unique.push(msg.sender);
            }
            return unique;
          }, []);

        console.log(`[CRON] Broadcast ${broadcast.id}: Found ${broadcastMessages.length} messages, ${messageSenders.length} unique eligible senders (excluding owner ${broadcastOwnerId})`);

        if (messageSenders.length === 0) {
          console.log(`[CRON] No eligible message senders for broadcast ${broadcast.id} (all messages were from owner or duplicates)`);
          
          // Mark as distributed even with no recipients to avoid reprocessing
          await prisma.cardBroadcast.update({
            where: { id: broadcast.id },
            data: { tip_distributed: true }
          });
          continue;
        }

        // Calculate tip per user (equal distribution)
        // Truncate 9 digits after the point. 333.333333339 => 333.33333333
        const tipPerUser = roundTo9(broadcast.tip_cati / messageSenders.length);
        const tipPerUserBigInt = BigInt(tipPerUser);

        console.log(`[CRON] Distributing ${tipPerUser} CATI to ${messageSenders.length} users for broadcast ${broadcast.id}`);

        // Use Prisma transaction to ensure atomicity
        const distributionResult = await prisma.$transaction(async (tx) => {
          const distributions = [];
          
          // Final safety check and process each sender within transaction
          for (const sender of messageSenders) {
            // Final safety check: never give tips to broadcast owner
            if (sender.id === broadcastOwnerId) {
              console.error(`[CRON] SAFETY CHECK FAILED: Almost gave tip to broadcast owner ${broadcastOwnerId} for broadcast ${broadcast.id}`);
              continue;
            }

            // Update user balance within transaction
            await tx.user.update({
              where: { id: sender.id },
              data: {
                catiBalance: {
                  increment: tipPerUserBigInt
                }
              }
            });

            // Create transaction record within transaction
            const transaction = await tx.catiTransaction.create({
              data: {
                userId: sender.id,
                type: 'CELEBRATION_TIP',
                amount: tipPerUserBigInt,
                description: `Celebration engagement reward from broadcast ${broadcast.id}`,
                referenceId: broadcast.id,
                source: 'OFFCHAIN'
              }
            });

            distributions.push({
              userId: sender.id.toString(),
              userNickname: sender.userNickname,
              amount: tipPerUser,
              transactionId: transaction.id.toString()
            });
          }

          // Only mark as distributed if all distributions succeeded
          await tx.cardBroadcast.update({
            where: { id: broadcast.id },
            data: { tip_distributed: true }
          });

          return distributions;
        });

        // Update counters only after successful transaction
        totalTipsDistributed += tipPerUserBigInt * BigInt(distributionResult.length);
        totalDistributions += distributionResult.length;

        console.log(`[CRON] Successfully distributed tips for broadcast ${broadcast.id}:`, {
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