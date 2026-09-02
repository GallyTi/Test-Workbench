import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Prílohy a Screenshoty (Attachments & S3)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post(':targetType/:targetId')
  @ApiOperation({ summary: 'Nahratie screenshotu / prílohy ku kroku, testu alebo bugu s aktualizáciou last_modified' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('targetType') targetType: 'STEP_EXECUTION' | 'TEST_CASE' | 'BUG',
    @Param('targetId') targetId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nebol nahraný žiadny súbor');
    }
    return this.attachmentsService.uploadAttachment(targetType, targetId, file, userId);
  }

  @Get(':targetType/:targetId')
  @ApiOperation({ summary: 'Získanie všetkých príloh pre danú entitu s bezpečnými presigned S3 URL' })
  async getForTarget(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    return this.attachmentsService.getAttachmentsForTarget(targetType, targetId);
  }
}
