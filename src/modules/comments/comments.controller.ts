import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/comment.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Komentáre a Mentions (Comments & @Users)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Pridanie nového komentára s podporou @mentions a formátovania' })
  async create(@Body() dto: CreateCommentDto, @CurrentUser('id') authorId: string) {
    return this.commentsService.create(dto, authorId);
  }

  @Get(':targetType/:targetId')
  @ApiOperation({ summary: 'Zoznam komentárov pre daný krok alebo entitu vrátane emotikonových reakcií' })
  async findForTarget(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    return this.commentsService.findForTarget(targetType, targetId);
  }

  @Post(':id/reactions')
  @ApiOperation({ summary: 'Pridanie alebo odstránenie emotikonovej reakcie na správu (Discord-style toggle)' })
  async toggleReaction(
    @Param('id') commentId: string,
    @Body('emoji') emoji: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.toggleReaction(commentId, emoji, userId);
  }
}
