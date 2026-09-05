import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Prílohy a Screenshoty (Attachments & S3)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get(':id/content')
  @Public()
  @ApiOperation({ summary: 'Priame streamovanie obrázka alebo prílohy pre <img> a video tagy bez CORS a bez zlyhania' })
  async getContent(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const fileData = await this.attachmentsService.getAttachmentFile(id);
    if (!fileData) {
      throw new NotFoundException('Súbor prílohy nebol nájdený');
    }

    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileData.fileName)}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
    if (fileData.size) {
      res.setHeader('Content-Length', fileData.size.toString());
    }

    (fileData.stream as any).pipe(res);
  }

  @Post(':targetType/:targetId')
  @ApiOperation({ summary: 'Nahratie screenshotu / prílohy ku kroku, testu, komentáru alebo bugu' })
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
    @Param('targetType') targetType: string,
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
  @ApiOperation({ summary: 'Získanie všetkých príloh pre danú entitu s priamymi URL odkazmi' })
  async getForTarget(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    return this.attachmentsService.getAttachmentsForTarget(targetType, targetId);
  }
}
