import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { getCatiBlockchainService } from '@/lib/blockchain';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = BigInt(decoded.sub);

    // Parse request body
    const body = await request.json();
    const { amount, toAddress } = body;

    // Validate inputs
    if (!amount || !toAddress) {
      return NextResponse.json(
        { error: 'Amount and toAddress are required' },
        { status: 400 }
      );
    }

    const withdrawAmount = BigInt(amount);
    if (withdrawAmount <= 0) {
      return NextResponse.json(
        { error: 'Withdrawal amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate wallet address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has sufficient balance
    if (user.catiBalance < withdrawAmount) {
      return NextResponse.json(
        { error: 'Insufficient CATI balance for withdrawal' },
        { status: 400 }
      );
    }

    // Check platform wallet balance before proceeding
    const blockchainService = getCatiBlockchainService();
    const platformBalanceCheck = await blockchainService.checkPlatformBalance();
    
    if (platformBalanceCheck.isLowBalance) {
      return NextResponse.json(
        { error: 'Withdrawal service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // Perform withdrawal and database updates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, deduct CATI from user balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          catiBalance: {
            decrement: withdrawAmount,
          },
        },
      });

      // Create pending withdrawal record
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: userId,
          amount: withdrawAmount,
          status: 'PENDING',
        },
      });

      // Create transaction record
      await tx.catiTransaction.create({
        data: {
          userId: userId,
          type: 'WITHDRAW',
          amount: -withdrawAmount, // Negative for outgoing
          description: `Withdrawal initiated: ${amount} CATI to ${toAddress}`,
          referenceId: withdrawal.id,
          source: 'ONCHAIN',
        },
      });

      return {
        withdrawal,
        newBalance: updatedUser.catiBalance.toString(),
      };
    });

    // Now attempt to send the actual blockchain transaction
    const withdrawalResult = await blockchainService.sendWithdrawal(toAddress, amount);
    
    if (!withdrawalResult.success) {
      // If blockchain transaction fails, we need to refund the user and update the withdrawal status
      await prisma.$transaction(async (tx) => {
        // Refund user balance
        await tx.user.update({
          where: { id: userId },
          data: {
            catiBalance: {
              increment: withdrawAmount,
            },
          },
        });

        // Update withdrawal status to failed
        await tx.withdrawal.update({
          where: { id: result.withdrawal.id },
          data: {
            status: 'FAILED',
          },
        });

        // Add refund transaction record
        await tx.catiTransaction.create({
          data: {
            userId: userId,
            type: 'WITHDRAW',
            amount: withdrawAmount, // Positive for refund
            description: `Withdrawal failed - refunded: ${amount} CATI. Error: ${withdrawalResult.error}`,
            referenceId: result.withdrawal.id,
            source: 'ONCHAIN',
          },
        });
      });

      return NextResponse.json(
        { error: `Withdrawal failed: ${withdrawalResult.error}` },
        { status: 500 }
      );
    }

    // Update withdrawal record with successful transaction hash
    await prisma.withdrawal.update({
      where: { id: result.withdrawal.id },
      data: {
        status: 'COMPLETED',
        txHash: withdrawalResult.txHash,
        completedAt: new Date(),
      },
    });

    // Update transaction description with tx hash
    await prisma.catiTransaction.updateMany({
      where: {
        userId: userId,
        type: 'WITHDRAW',
        referenceId: result.withdrawal.id,
        amount: -withdrawAmount,
      },
      data: {
        description: `Withdrawal completed: ${amount} CATI to ${toAddress} (tx: ${withdrawalResult.txHash})`,
      },
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: result.withdrawal.id.toString(),
        amount: result.withdrawal.amount.toString(),
        status: 'COMPLETED',
        requestedAt: result.withdrawal.requestedAt,
        txHash: withdrawalResult.txHash,
      },
      newBalance: result.newBalance,
      message: `Withdrawal of ${amount} CATI completed successfully! Transaction hash: ${withdrawalResult.txHash}`,
    });

  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
