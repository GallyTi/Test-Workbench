import { Module } from '@nestjs/common';
import { TestRunsService } from './test-runs.service';
import { TestRunsController } from './test-runs.controller';

@Module({
  providers: [TestRunsService],
  controllers: [TestRunsController],
  exports: [TestRunsService],
})
export class TestRunsModule {}
