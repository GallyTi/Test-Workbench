import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Res,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
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
  @ApiOperation({ summary: 'Priame streamovanie obrázka alebo videa s podporou HTTP 206 Partial Content (Range)' })
  async getContent(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const rangeHeader = req.headers.range;
    let range: { start: number; end?: number } | undefined;

    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : undefined;
      if (!isNaN(start)) {
        range = { start, end };
      }
    }

    const fileData = await this.attachmentsService.getAttachmentFile(id, range);
    if (!fileData) {
      throw new NotFoundException('Súbor prílohy nebol nájdený');
    }

    res.setHeader('Content-Type', fileData.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileData.fileName)}"`);
    res.setHeader('Accept-Ranges', 'bytes');

    if (range && fileData.totalSize) {
      const start = range.start;
      const end = range.end !== undefined && range.end < fileData.totalSize ? range.end : fileData.totalSize - 1;
      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileData.totalSize}`);
      res.setHeader('Content-Length', chunkSize.toString());
    } else {
      res.status(200);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
      if (fileData.size) {
        res.setHeader('Content-Length', fileData.size.toString());
      }
    }

    (fileData.stream as any).pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Vymazanie prílohy alebo screenshotu' })
  async deleteAttachment(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.attachmentsService.deleteAttachment(id, userId);
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
