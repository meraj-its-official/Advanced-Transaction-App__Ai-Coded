import { Module } from '@nestjs/common';
import { FraudService } from './fraud.service';
import { FraudListener } from './fraud.listener';

@Module({
  providers: [FraudService, FraudListener],
  exports: [FraudService],
})
export class FraudModule {}
