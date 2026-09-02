import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);
  private webhookUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('TEAMS_WEBHOOK_URL') || '';
  }

  async sendTeamsMessage(title: string, message: string, facts?: Array<{ name: string; value: string }>, actionUrl?: string) {
    if (!this.webhookUrl) {
      this.logger.debug('Teams webhook URL nie je nakonfigurovaná, preskakujem odoslanie.');
      return false;
    }

    try {
      const payload = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: '0076D7',
        summary: title,
        sections: [
          {
            activityTitle: `📢 ${title}`,
            activitySubtitle: 'RITS Test Workbench Notifikácia',
            text: message,
            facts: facts || [],
            markdown: true,
          },
        ],
        potentialAction: actionUrl
          ? [
              {
                '@type': 'OpenUri',
                name: 'Otvoriť v aplikácii',
                targets: [{ os: 'default', uri: actionUrl }],
              },
            ]
          : [],
      };

      await axios.post(this.webhookUrl, payload);
      this.logger.log(`MS Teams notifikácia úspešne odoslaná: ${title}`);
      return true;
    } catch (error) {
      this.logger.error('Chyba pri odosielaní správy do MS Teams webhooku:', error.message);
      return false;
    }
  }
}
