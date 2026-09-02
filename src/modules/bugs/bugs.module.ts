import { Module } from '@nestjs/common';
import { BugsService } from './bugs.service';
import { BugsController } from './bugs.controller';

@Module({
  providers: [BugsService],
  controllers: [BugsController],
  exports: [BugsService],
})
export class BugsModule {}
