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
    // This endpoint accepts deposits initiated from frontend wallet (via MetaMask)
    // Frontend transfers tokens to platform wallet, then sends txHash for verification
    const body = await request.json();
    const { amount, fromAddress, txHash } = body;

    // Validate inputs
    if (!amount || !fromAddress) {
      return NextResponse.json(
        { error: 'Amount, fromAddress, and txHash are required for deposit verification' },
        { status: 400 }
      );
    }

    // For deposits, we require a transaction hash to verify the blockchain transaction
    if (!txHash) {
      return NextResponse.json(
        { error: 'Transaction hash is required to verify the deposit' },
        { status: 400 }
      );
    }

    const depositAmount = parseFloat(amount);
    if (depositAmount <= 0) {
      return NextResponse.json(
        { error: 'Deposit amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate wallet address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(fromAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
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

    // Verify the wallet address matches the user's address
    if (user.walletAddress.toLowerCase() !== fromAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Wallet address does not match user account' },
        { status: 400 }
      );
    }

    // Check if txHash is already used (prevent double spending)
    const existingDeposit = await prisma.deposit.findFirst({
      where: { txHash: txHash },
    });

    if (existingDeposit) {
      return NextResponse.json(
        { error: 'This transaction has already been processed' },
        { status: 400 }
      );
    }

    // Verify the deposit transaction on the blockchain
    const blockchainService = getCatiBlockchainService();
    const verificationResult = await blockchainService.verifyDepositTransaction(
      txHash,
      fromAddress,
      amount
    );

    if (!verificationResult.isValid) {
      return NextResponse.json(
        { error: `Invalid deposit transaction: ${verificationResult.error}` },
        { status: 400 }
      );
    }

    // Use the actual amount from the blockchain transaction
    const actualAmount = verificationResult.actualAmount || amount;
    const depositAmountBigInt = BigInt(Math.floor(parseFloat(actualAmount)));

    // Create deposit record and update user balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Add CATI to user balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          catiBalance: {
            increment: depositAmountBigInt,
          },
        },
      });

      // Create deposit record (always completed since we verified the transaction)
      const deposit = await tx.deposit.create({
        data: {
          userId: userId,
          amount: depositAmountBigInt,
          status: 'COMPLETED',
          txHash: txHash,
          completedAt: new Date(),
        },
      });

      // Create transaction record
      await tx.catiTransaction.create({
        data: {
          userId: userId,
          type: 'DEPOSIT',
          amount: depositAmountBigInt, // Positive for incoming
          description: `Deposit confirmed: ${actualAmount} CATI from transaction ${txHash}`,
          referenceId: deposit.id,
          source: 'ONCHAIN',
        },
      });

      return {
        deposit,
        newBalance: updatedUser.catiBalance.toString(),
      };
    });

    return NextResponse.json({
      success: true,
      deposit: {
        id: result.deposit.id.toString(),
        amount: result.deposit.amount.toString(),
        status: result.deposit.status,
        requestedAt: result.deposit.requestedAt,
        completedAt: result.deposit.completedAt,
        txHash: result.deposit.txHash,
      },
      newBalance: result.newBalance,
      message: `Deposit of ${actualAmount} CATI confirmed and added to your account`,
    });

  } catch (error) {
    console.error('Error creating deposit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
