import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface FraudAssessmentInput {
  senderId: string;
  amount: number;
  walletId: string;
  reference: string;
}

export interface FraudAssessmentResult {
  riskScore: number;
  reasons: string[];
  shouldBlock: boolean;
}

@Injectable()
export class FraudService {
  constructor(private readonly prisma: PrismaService) {}

  async assessRisk(input: FraudAssessmentInput): Promise<FraudAssessmentResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Rule 1: High-value transaction (> 50,000)
    if (input.amount > 50000) {
      riskScore += 0.3;
      reasons.push('High-value transaction (> ₹50,000)');
    }

    // Rule 2: New account (< 7 days)
    const user = await this.prisma.user.findUnique({
      where: { id: input.senderId },
      select: { createdAt: true },
    });
    if (user) {
      const accountAgeDays =
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (accountAgeDays < 7) {
        riskScore += 0.2;
        reasons.push('New account (< 7 days old)');
      }
    }

    // Rule 3: Multiple transactions in last 1 hour > 5
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTxnCount = await this.prisma.transaction.count({
      where: {
        fromWalletId: input.walletId,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (recentTxnCount > 5) {
      riskScore += 0.3;
      reasons.push(`High transaction frequency (${recentTxnCount} transactions in last hour)`);
    }

    // Rule 4: Round number amount (possible structuring)
    if (input.amount % 1000 === 0 && input.amount >= 10000) {
      riskScore += 0.1;
      reasons.push('Suspiciously round amount');
    }

    // Cap at 1.0
    riskScore = Math.min(riskScore, 1.0);
    const shouldBlock = riskScore >= 0.7;

    return { riskScore, reasons, shouldBlock };
  }
}
