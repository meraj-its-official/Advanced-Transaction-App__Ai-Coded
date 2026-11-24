import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBankAccountDto } from './dto/bank-account.dto';

@Injectable()
export class BankAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.bankAccount.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(userId: string, id: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id },
    });
    if (!account) throw new NotFoundException('Bank account not found');
    if (account.userId !== userId) throw new ForbiddenException('Not your bank account');
    return account;
  }

  async create(userId: string, dto: CreateBankAccountDto) {
    // Check if account number already linked for this user
    const existing = await this.prisma.bankAccount.findFirst({
      where: { userId, accountNumber: dto.accountNumber },
    });
    if (existing) {
      throw new ConflictException('Bank account already linked');
    }

    // Check if first account, make primary
    const count = await this.prisma.bankAccount.count({ where: { userId } });
    const isPrimary = count === 0 || dto.isPrimary === true;

    if (isPrimary && count > 0) {
      await this.prisma.bankAccount.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.bankAccount.create({
      data: {
        userId,
        accountNumber: dto.accountNumber,
        ifscCode: dto.ifscCode.toUpperCase(),
        bankName: dto.bankName,
        holderName: dto.holderName || dto.accountHolderName || 'Account Holder',
        isVerified: true, // auto-verified for simulation
        isPrimary,
      },
    });
  }

  async setPrimary(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.$transaction([
      this.prisma.bankAccount.updateMany({
        where: { userId },
        data: { isPrimary: false },
      }),
      this.prisma.bankAccount.update({
        where: { id },
        data: { isPrimary: true },
      }),
    ]);

    return { message: 'Primary bank account updated' };
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.bankAccount.delete({
      where: { id },
    });

    return { message: 'Bank account removed successfully' };
  }
}
