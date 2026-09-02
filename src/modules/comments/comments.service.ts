import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCommentDto } from './dto/comment.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(dto: CreateCommentDto, authorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          targetType: dto.targetType,
          targetId: dto.targetId,
          authorId,
          content: dto.content,
        },
        include: {
          author: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          reactions: {
            include: {
              user: { select: { id: true, fullName: true } },
            },
          },
        },
      });

      // Handle mentions
      if (dto.mentionedUserIds && dto.mentionedUserIds.length > 0) {
        await tx.commentMention.createMany({
          data: dto.mentionedUserIds.map((uid) => ({
            commentId: comment.id,
            mentionedUserId: uid,
          })),
        });

        // Vytvorenie notifikácií pre označených používateľov
        await tx.notification.createMany({
          data: dto.mentionedUserIds.map((uid) => ({
            userId: uid,
            type: 'MENTION',
            title: `${comment.author.fullName} ťa označil v komentári`,
            message: dto.content.slice(0, 150),
            actionUrl: `/test-runs?target=${dto.targetId}`,
          })),
        });
      }

      // Aktualizácia časovej pečiatky kroku
      if (dto.targetType === 'STEP_EXECUTION') {
        await tx.testStepExecution.update({
          where: { id: dto.targetId },
          data: { updatedAt: new Date(), lastModifiedById: authorId },
        });
      }

      this.realtimeGateway.server.emit('comment_created', comment);

      return comment;
    });
  }

  async findForTarget(targetType: string, targetId: string) {
    return this.prisma.comment.findMany({
      where: { targetType, targetId },
      include: {
        author: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        mentions: {
          include: {
            mentionedUser: { select: { id: true, fullName: true, email: true } },
          },
        },
        reactions: {
          include: {
            user: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async toggleReaction(commentId: string, emoji: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Komentár nebol nájdený');
    }

    const existingReaction = await this.prisma.commentReaction.findUnique({
      where: {
        commentId_userId_emoji: {
          commentId,
          userId,
          emoji,
        },
      },
    });

    if (existingReaction) {
      await this.prisma.commentReaction.delete({
        where: { id: existingReaction.id },
      });
    } else {
      await this.prisma.commentReaction.create({
        data: {
          commentId,
          userId,
          emoji,
        },
      });
    }

    const allReactions = await this.prisma.commentReaction.findMany({
      where: { commentId },
      include: {
        user: { select: { id: true, fullName: true } },
      },
    });

    this.realtimeGateway.server.emit('comment_reaction_updated', {
      commentId,
      reactions: allReactions,
    });

    return allReactions;
  }
}
