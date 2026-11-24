import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';

interface PaymentCompletedEvent {
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  amount: number;
  transactionId: string;
  reference: string;
}

interface PaymentFailedEvent {
  senderId: string;
  amount: number;
  reason: string;
  reference: string;
}

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('payment.completed', { async: true })
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    try {
      // Notify sender
      await this.notificationsService.createNotification(
        event.senderId,
        'Payment Sent ✅',
        `₹${event.amount.toLocaleString('en-IN')} sent to ${event.recipientName} successfully`,
        'TRANSACTION',
        { transactionId: event.transactionId, reference: event.reference },
      );

      // Notify recipient
      await this.notificationsService.createNotification(
        event.recipientId,
        'Money Received 💰',
        `₹${event.amount.toLocaleString('en-IN')} received from ${event.senderName}`,
        'TRANSACTION',
        { transactionId: event.transactionId, reference: event.reference },
      );
    } catch (error) {
      this.logger.error('Failed to create payment notifications', error);
    }
  }

  @OnEvent('payment.failed', { async: true })
  async handlePaymentFailed(event: PaymentFailedEvent) {
    try {
      await this.notificationsService.createNotification(
        event.senderId,
        'Payment Failed ❌',
        `Payment of ₹${event.amount.toLocaleString('en-IN')} failed: ${event.reason}`,
        'TRANSACTION',
        { reference: event.reference, reason: event.reason },
      );
    } catch (error) {
      this.logger.error('Failed to create failure notification', error);
    }
  }
}
