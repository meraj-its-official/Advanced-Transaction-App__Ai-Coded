import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma.service';
import { AddMoneyDto, WithdrawDto, SetPinDto } from './dto/wallet.dto';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        sentTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        rcvdTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    // Combine and sort recent transactions
    const recentTransactions = [
      ...wallet.sentTransactions,
      ...wallet.rcvdTransactions,
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance,
      currency: wallet.currency,
      isLocked: wallet.isLocked,
      transactions: recentTransactions,
    };
  }

  async addMoney(userId: string, dto: AddMoneyDto) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.isLocked) throw new BadRequestException('Wallet is locked');

    const refId = `TOP_UP_${uuidv4()}`;

    const result = await this.prisma.$transaction(async (tx: any) => {
      const transaction = await tx.transaction.create({
        data: {
          toWalletId: wallet.id,
          type: 'TOP_UP',
          amount: dto.amount,
          currency: 'INR',
          status: 'COMPLETED',
          description: `Added money from bank account`,
          referenceId: refId,
          metadata: { bankAccountId: dto.bankAccountId, source: 'BANK_TRANSFER' },
        },
      });

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: dto.amount } },
      });

      return { transaction, wallet: updatedWallet };
    });

    return {
      message: 'Money added successfully',
      amount: dto.amount,
      newBalance: result.wallet.balance,
      transactionId: result.transaction.id,
      referenceId: result.transaction.referenceId,
    };
  }

  async withdraw(userId: string, dto: WithdrawDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    if (!user || !user.wallet) throw new NotFoundException('Wallet not found');
    if (user.wallet.isLocked) throw new BadRequestException('Wallet is locked');

    // Verify PIN against user.pin
    if (user.pin) {
      const pinValid = await bcrypt.compare(dto.pin, user.pin);
      if (!pinValid) throw new UnauthorizedException('Invalid PIN');
    } else {
      throw new BadRequestException('Payment PIN not set. Please create a 6-digit payment PIN first.');
    }

    if (Number(user.wallet.balance) < dto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const refId = `WD_${uuidv4()}`;

    const result = await this.prisma.$transaction(async (tx: any) => {
      const transaction = await tx.transaction.create({
        data: {
          fromWalletId: user.wallet!.id,
          type: 'WITHDRAWAL',
          amount: dto.amount,
          currency: 'INR',
          status: 'COMPLETED',
          description: `Withdrawal to bank account`,
          referenceId: refId,
          metadata: { bankAccountId: dto.bankAccountId },
        },
      });

      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: { decrement: dto.amount } },
      });

      return { transaction, wallet: updatedWallet };
    });

    return {
      message: 'Withdrawal successful',
      amount: dto.amount,
      newBalance: result.wallet.balance,
      transactionId: result.transaction.id,
      referenceId: result.transaction.referenceId,
    };
  }

  async setPin(userId: string, dto: SetPinDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    if (dto.password && user.passwordHash) {
      const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    if (!/^\d{6}$/.test(dto.pin)) {
      throw new BadRequestException('Payment PIN must be exactly 6 digits');
    }

    const hashedPin = await bcrypt.hash(dto.pin, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { pin: hashedPin },
    });

    return {
      success: true,
      message: '6-Digit Payment PIN set successfully',
    };
  }
}
