import { Global, Module } from '@nestjs/common';
import { ArcjetService } from './arcjet.service';
import { ArcjetSecurityGuard } from './arcjet.guard';

@Global()
@Module({
  providers: [ArcjetService, ArcjetSecurityGuard],
  exports: [ArcjetService, ArcjetSecurityGuard],
})
export class ArcjetSecurityModule {}
