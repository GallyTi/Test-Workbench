import { Module, Global } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { StepLockService } from './step-lock.service';

@Global()
@Module({
  providers: [RealtimeGateway, StepLockService],
  exports: [RealtimeGateway, StepLockService],
})
export class RealtimeModule {}
