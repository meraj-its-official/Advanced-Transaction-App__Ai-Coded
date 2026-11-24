import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FraudService, FraudAssessmentInput } from './fraud.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FraudListener {
  private readonly logger = new Logger(FraudListener.name);

  constructor(
    private readonly fraudService: FraudService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('payment.initiated', { async: true })
  async handlePaymentInitiated(payload: FraudAssessmentInput) {
    try {
      const result = await this.fraudService.assessRisk(payload);

      if (result.shouldBlock) {
        this.logger.warn(
          `🚨 HIGH RISK payment flagged! Ref: ${payload.reference}, ` +
            `Score: ${result.riskScore.toFixed(2)}, Reasons: ${result.reasons.join(', ')}`,
        );
      } else if (result.riskScore > 0.3) {
        this.logger.warn(
          `⚠️ MEDIUM RISK payment flagged. Ref: ${payload.reference}, ` +
            `Score: ${result.riskScore.toFixed(2)}, Reasons: ${result.reasons.join(', ')}`,
        );
      } else {
        this.logger.log(
          `✅ LOW RISK payment cleared. Ref: ${payload.reference}, ` +
            `Score: ${result.riskScore.toFixed(2)}`,
        );
      }
    } catch (error) {
      this.logger.error(`Fraud assessment failed for ${payload.reference}`, error);
    }
  }
}
