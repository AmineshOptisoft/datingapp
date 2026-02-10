import Wallet from "@/models/Wallet";
import Transaction from "@/models/Transaction";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

interface DeductCoinsParams {
  userId: string;
  amount: number;
  description: string;
  mediaType?: 'image' | 'video';
  sceneId?: string;
}

interface AddCoinsParams {
  userId: string;
  amount: number;
  description: string;
  type: 'purchase' | 'bonus' | 'refund';
  packageType?: 'starter' | 'popular' | 'premium';
  stripePaymentId?: string;
  stripeSessionId?: string;
}

export class WalletService {
  /**
   * Get or create wallet for user
   */
  static async getWallet(userId: string) {
    await dbConnect();
    
    let wallet = await Wallet.findOne({ userId });
    
    // Auto-create wallet if doesn't exist
    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 100, // Free coins for new users
      });

      // Log the bonus transaction
      await Transaction.create({
        userId,
        type: 'bonus',
        amount: 100,
        balanceAfter: 100,
        description: 'Welcome bonus - New user registration',
      });

      console.log(`✨ Created wallet for user ${userId} with 100 free coins`);
    }

    return wallet;
  }

  /**
   * Deduct coins from wallet (for media generation)
   */
  static async deductCoins(params: DeductCoinsParams) {
    const { userId, amount, description, mediaType, sceneId } = params;
    
    await dbConnect();

    // Use MongoDB session for transaction safety
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await Wallet.findOne({ userId }).session(session);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.balance < amount) {
        throw new Error('INSUFFICIENT_COINS');
      }

      // Update wallet balance
      wallet.balance -= amount;
      wallet.totalSpent += amount;
      await wallet.save({ session });

      // Log transaction
      const transaction = await Transaction.create([{
        userId,
        type: 'deduction',
        amount: -amount, // Negative for deduction
        balanceAfter: wallet.balance,
        description,
        metadata: {
          mediaType,
          sceneId: sceneId ? new mongoose.Types.ObjectId(sceneId) : undefined,
        }
      }], { session });

      await session.commitTransaction();
      
      console.log(`💰 Deducted ${amount} coins from user ${userId}. New balance: ${wallet.balance}`);

      return {
        success: true,
        balance: wallet.balance,
        transaction: transaction[0]
      };

    } catch (error: any) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Add coins to wallet (for purchases/bonuses)
   */
  static async addCoins(params: AddCoinsParams) {
    const { userId, amount, description, type, packageType, stripePaymentId, stripeSessionId } = params;
    
    await dbConnect();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await Wallet.findOne({ userId }).session(session);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Update wallet
      wallet.balance += amount;
      wallet.totalPurchased += amount;

      // Check if this is a premium lifetime package
      if (packageType === 'premium') {
        wallet.isLifetime = true;
        wallet.lifetimeCoins = amount;
      }

      await wallet.save({ session });

      // Log transaction
      const transaction = await Transaction.create([{
        userId,
        type,
        amount,
        balanceAfter: wallet.balance,
        description,
        metadata: {
          packageType,
          stripePaymentId,
          stripeSessionId,
        }
      }], { session });

      await session.commitTransaction();

      console.log(`✅ Added ${amount} coins to user ${userId}. New balance: ${wallet.balance}`);

      return {
        success: true,
        balance: wallet.balance,
        transaction: transaction[0]
      };

    } catch (error: any) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get transaction history
   */
  static async getTransactions(userId: string, limit = 50, offset = 0) {
    await dbConnect();

    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const total = await Transaction.countDocuments({ userId });

    return {
      transactions,
      total,
      hasMore: total > offset + limit
    };
  }

  /**
   * Check if user has enough coins
   */
  static async hasEnoughCoins(userId: string, amount: number): Promise<boolean> {
    await dbConnect();
    const wallet = await Wallet.findOne({ userId });
    return wallet ? wallet.balance >= amount : false;
  }
}
