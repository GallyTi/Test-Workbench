import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { TeamsService } from './teams.service';

@Module({
  providers: [NotificationsService, EmailService, TeamsService],
  controllers: [NotificationsController],
  exports: [NotificationsService, EmailService, TeamsService],
})
export class NotificationsModule {}
