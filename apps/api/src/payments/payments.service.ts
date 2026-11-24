import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma.service';
import { SendMoneyDto, GetHistoryDto } from './dto/payments.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async sendMoney(userId: string, dto: SendMoneyDto) {
    // 1. Get sender with wallet
    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    if (!sender || !sender.wallet) throw new NotFoundException('Sender wallet not found');
    if (sender.wallet.isLocked) throw new BadRequestException('Sender wallet is locked');

    // 2. Find recipient by phone
    const cleanRecipientPhone = dto.recipientPhone.replace(/^\+91/, '').replace(/\D/g, '');
    const recipient = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: dto.recipientPhone },
          { phone: cleanRecipientPhone },
          { phone: `+91${cleanRecipientPhone}` },
        ],
      },
      include: { wallet: true },
    });
    if (!recipient || !recipient.wallet) {
      throw new NotFoundException('Recipient not found or does not have an active wallet');
    }
    if (recipient.id === userId) {
      throw new BadRequestException('Cannot send money to yourself');
    }
    if (recipient.wallet.isLocked) {
      throw new BadRequestException('Recipient wallet is locked');
    }

    // 3. Check sender balance
    if (Number(sender.wallet.balance) < dto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // 4. Verify PIN
    if (sender.pin) {
      const pinValid = await bcrypt.compare(dto.pin, sender.pin);
      if (!pinValid) throw new UnauthorizedException('Invalid PIN');
    }

    const refId = `TXN_${uuidv4()}`;

    // 5. Emit event for fraud check (async)
    this.eventEmitter.emit('payment.initiated', {
      senderId: userId,
      amount: dto.amount,
      walletId: sender.wallet.id,
      reference: refId,
    });

    const transferNote = dto.note || dto.description || `Transfer to ${recipient.name}`;

    // 6. Execute atomic transfer in single Prisma transaction
    const transaction = await this.prisma.$transaction(async (tx: any) => {
      // Debit sender
      await tx.wallet.update({
        where: { id: sender.wallet!.id },
        data: { balance: { decrement: dto.amount } },
      });

      // Credit recipient
      await tx.wallet.update({
        where: { id: recipient.wallet!.id },
        data: { balance: { increment: dto.amount } },
      });

      // Create transaction linking fromWallet to toWallet
      return tx.transaction.create({
        data: {
          fromWalletId: sender.wallet!.id,
          toWalletId: recipient.wallet!.id,
          amount: dto.amount,
          currency: 'INR',
          type: 'TRANSFER',
          status: 'COMPLETED',
          description: transferNote,
          referenceId: refId,
          metadata: {
            senderPhone: sender.phone,
            recipientPhone: recipient.phone,
            recipientName: recipient.name,
            note: transferNote,
          },
        },
      });
    });

    // 7. Emit notification events
    this.eventEmitter.emit('payment.completed', {
      senderId: userId,
      senderName: sender.name,
      recipientId: recipient.id,
      recipientName: recipient.name,
      amount: dto.amount,
      transactionId: transaction.id,
      reference: refId,
    });

    return {
      message: 'Payment successful',
      transactionId: transaction.id,
      referenceId: transaction.referenceId,
      amount: dto.amount,
      recipient: {
        id: recipient.id,
        name: recipient.name,
        phone: recipient.phone,
        email: recipient.email,
      },
    };
  }

  async getRecipients(userId: string, query?: string) {
    const where: any = {
      id: { not: userId },
      isActive: true,
      wallet: { isNot: null },
    };

    if (query && query.trim()) {
      const q = query.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        kycStatus: true,
        wallet: {
          select: {
            id: true,
            isLocked: true,
          },
        },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u: any) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      isVerified: u.kycStatus === 'VERIFIED',
      hasWallet: !!u.wallet && !u.wallet.isLocked,
    }));
  }

  async getHistory(userId: string, dto: GetHistoryDto) {
    const page = Number(dto.page ?? 1);
    const limit = Math.min(Number(dto.limit ?? 20), 100);
    const skip = (page - 1) * limit;

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const where: any = {
      OR: [
        { fromWalletId: wallet.id },
        { toWalletId: wallet.id },
      ],
    };

    if (dto.type && dto.type !== 'ALL') {
      where.type = dto.type;
    }

    if (dto.search && dto.search.trim()) {
      const q = dto.search.trim();
      where.AND = [
        {
          OR: [
            { description: { contains: q, mode: 'insensitive' } },
            { referenceId: { contains: q, mode: 'insensitive' } },
            { id: { contains: q, mode: 'insensitive' } },
            { fromWallet: { user: { name: { contains: q, mode: 'insensitive' } } } },
            { fromWallet: { user: { phone: { contains: q } } } },
            { toWallet: { user: { name: { contains: q, mode: 'insensitive' } } } },
            { toWallet: { user: { phone: { contains: q } } } },
          ],
        },
      ];
    }

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          fromWallet: { include: { user: { select: { name: true, phone: true } } } },
          toWallet: { include: { user: { select: { name: true, phone: true } } } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const items = transactions.map((t: any) => {
      const isCredit = t.toWalletId === wallet.id;
      const recipientName = t.toWallet?.user?.name || (t.metadata as any)?.recipientName;
      const recipientPhone = t.toWallet?.user?.phone || (t.metadata as any)?.recipientPhone;
      const senderName = t.fromWallet?.user?.name || (t.metadata as any)?.senderName;
      const senderPhone = t.fromWallet?.user?.phone || (t.metadata as any)?.senderPhone;
      return {
        id: t.id,
        type: t.type,
        status: t.status,
        amount: Number(t.amount),
        currency: t.currency,
        description: t.description,
        referenceId: t.referenceId,
        metadata: t.metadata,
        createdAt: t.createdAt,
        isCredit,
        recipientName,
        recipientPhone,
        senderName,
        senderPhone,
      };
    });

    return {
      items,
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getTransaction(userId: string, txnId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: txnId,
        OR: [
          { fromWalletId: wallet.id },
          { toWalletId: wallet.id },
        ],
      },
      include: {
        fromWallet: { include: { user: { select: { name: true, phone: true } } } },
        toWallet: { include: { user: { select: { name: true, phone: true } } } },
      },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const isCredit = transaction.toWalletId === wallet.id;
    return {
      ...transaction,
      amount: Number(transaction.amount),
      isCredit,
      recipientName: transaction.toWallet?.user?.name || (transaction.metadata as any)?.recipientName,
      recipientPhone: transaction.toWallet?.user?.phone || (transaction.metadata as any)?.recipientPhone,
      senderName: transaction.fromWallet?.user?.name || (transaction.metadata as any)?.senderName,
      senderPhone: transaction.fromWallet?.user?.phone || (transaction.metadata as any)?.senderPhone,
    };
  }

  async lookupUser(phone: string) {
    const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          { phone: `+91${cleanPhone}` },
          { phone: cleanPhone },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        isActive: true,
        kycStatus: true,
        wallet: {
          select: {
            id: true,
            isLocked: true,
          },
        },
      },
    });
    if (!user || !user.isActive) {
      throw new NotFoundException('User not found with this mobile number');
    }
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      isVerified: user.kycStatus === 'VERIFIED',
      hasWallet: !!user.wallet && !user.wallet.isLocked,
    };
  }
}
