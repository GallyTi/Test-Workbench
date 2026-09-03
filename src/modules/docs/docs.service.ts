import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDocSpaceDto, UpdateDocSpaceDto, CreateDocPageDto, UpdateDocPageDto } from './dto/docs.dto';

@Injectable()
export class DocsService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // Spaces
  // -------------------------------------------------------------

  async findSpaces(projectId?: string) {
    const where: any = {};
    if (projectId) {
      where.OR = [{ projectId }, { projectId: null }];
    }

    return this.prisma.docSpace.findMany({
      where,
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
        _count: { select: { pages: true } },
      },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findSpaceWithTree(spaceId: string) {
    const space = await this.prisma.docSpace.findUnique({
      where: { id: spaceId },
      include: {
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    if (!space) {
      throw new NotFoundException('Dokumentačný priestor nebol nájdený');
    }

    // Get all pages in space
    const allPages = await this.prisma.docPage.findMany({
      where: { spaceId },
      select: {
        id: true,
        spaceId: true,
        parentPageId: true,
        title: true,
        slug: true,
        icon: true,
        orderIndex: true,
        isPublished: true,
        tags: true,
        updatedAt: true,
        author: { select: { id: true, fullName: true } },
      },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
    });

    // Build hierarchical tree
    const pageMap = new Map<string, any>();
    allPages.forEach((p) => {
      pageMap.set(p.id, { ...p, children: [] });
    });

    const rootPages: any[] = [];
    allPages.forEach((p) => {
      const node = pageMap.get(p.id);
      if (p.parentPageId && pageMap.has(p.parentPageId)) {
        pageMap.get(p.parentPageId).children.push(node);
      } else {
        rootPages.push(node);
      }
    });

    return {
      ...space,
      pagesTree: rootPages,
      totalPagesCount: allPages.length,
    };
  }

  async createSpace(userId: string, dto: CreateDocSpaceDto) {
    const key = dto.key.toUpperCase().trim();

    const existing = await this.prisma.docSpace.findFirst({
      where: {
        key,
        projectId: dto.projectId || null,
      },
    });

    if (existing) {
      throw new ConflictException(`Priestor s kľúčom "${key}" už existuje.`);
    }

    const space = await this.prisma.docSpace.create({
      data: {
        key,
        name: dto.name,
        description: dto.description,
        icon: dto.icon || '📚',
        color: dto.color || '#3b82f6',
        projectId: dto.projectId || null,
        createdById: userId,
      },
    });

    // Create a default welcome/index page for the space
    await this.createPage(userId, {
      spaceId: space.id,
      title: `Prehľad priestoru: ${space.name}`,
      icon: '🏠',
      content: `# Vitajte v dokumentačnom priestore ${space.name}\n\nTento priestor slúži ako centrálna znalostná báza a Confluence dokumentácia pre projekt.\n\n:::info\nMôžete tu vytvárať vnorené stránky, vkladať fotografie, videá, tabuľky a prepojovať dokumentáciu s testovacími scenármi.\n:::\n\n## Rýchle odkazy\n- Kliknite na **"+ Nová stránka"** v ľavom paneli pre vytvorenie podstránky.\n- Použite editor na písanie vo Word/Markdown štýle.`,
      tags: ['Prehľad', 'Dokumentácia'],
    });

    return space;
  }

  async updateSpace(spaceId: string, dto: UpdateDocSpaceDto) {
    return this.prisma.docSpace.update({
      where: { id: spaceId },
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
      },
    });
  }

  async deleteSpace(spaceId: string) {
    return this.prisma.docSpace.delete({
      where: { id: spaceId },
    });
  }

  // -------------------------------------------------------------
  // Pages
  // -------------------------------------------------------------

  async findPage(pageId: string) {
    const page = await this.prisma.docPage.findUnique({
      where: { id: pageId },
      include: {
        author: { select: { id: true, fullName: true, email: true } },
        lastEditedBy: { select: { id: true, fullName: true, email: true } },
        childPages: {
          select: {
            id: true,
            title: true,
            slug: true,
            icon: true,
            orderIndex: true,
            updatedAt: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        revisions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            editedBy: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Dokumentačná stránka nebola nájdená');
    }

    // Build breadcrumbs
    const breadcrumbs: { id: string; title: string; icon: string }[] = [];
    let currentParentId = page.parentPageId;

    while (currentParentId) {
      const parent = await this.prisma.docPage.findUnique({
        where: { id: currentParentId },
        select: { id: true, title: true, icon: true, parentPageId: true },
      });

      if (!parent) break;
      breadcrumbs.unshift({ id: parent.id, title: parent.title, icon: parent.icon });
      currentParentId = parent.parentPageId;
    }

    return {
      ...page,
      breadcrumbs,
    };
  }

  private slugify(text: string): string {
    return (
      text
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-') || 'page'
    );
  }

  async createPage(userId: string, dto: CreateDocPageDto) {
    const space = await this.prisma.docSpace.findUnique({
      where: { id: dto.spaceId },
    });

    if (!space) {
      throw new NotFoundException('Priestor nebol nájdený');
    }

    const slug = `${this.slugify(dto.title)}-${Date.now().toString(36)}`;

    // Determine order index
    const count = await this.prisma.docPage.count({
      where: {
        spaceId: dto.spaceId,
        parentPageId: dto.parentPageId || null,
      },
    });

    return this.prisma.docPage.create({
      data: {
        spaceId: dto.spaceId,
        parentPageId: dto.parentPageId || null,
        title: dto.title,
        slug,
        content: dto.content || '',
        icon: dto.icon || '📄',
        coverUrl: dto.coverUrl,
        tags: dto.tags || [],
        orderIndex: count,
        authorId: userId,
        lastEditedById: userId,
      },
      include: {
        author: { select: { id: true, fullName: true } },
      },
    });
  }

  async updatePage(pageId: string, userId: string, dto: UpdateDocPageDto) {
    const existing = await this.prisma.docPage.findUnique({
      where: { id: pageId },
    });

    if (!existing) {
      throw new NotFoundException('Stránka nebola nájdená');
    }

    // If title or content changed, save previous state into revisions history
    if (
      (dto.content !== undefined && dto.content !== existing.content) ||
      (dto.title !== undefined && dto.title !== existing.title)
    ) {
      await this.prisma.docPageRevision.create({
        data: {
          pageId,
          title: existing.title,
          content: existing.content,
          editedById: userId,
          changeSummary: dto.changeSummary || 'Úprava obsahu stránky',
        },
      });
    }

    return this.prisma.docPage.update({
      where: { id: pageId },
      data: {
        title: dto.title !== undefined ? dto.title : undefined,
        content: dto.content !== undefined ? dto.content : undefined,
        icon: dto.icon !== undefined ? dto.icon : undefined,
        coverUrl: dto.coverUrl !== undefined ? dto.coverUrl : undefined,
        parentPageId: dto.parentPageId !== undefined ? dto.parentPageId : undefined,
        orderIndex: dto.orderIndex !== undefined ? dto.orderIndex : undefined,
        tags: dto.tags !== undefined ? dto.tags : undefined,
        lastEditedById: userId,
      },
      include: {
        author: { select: { id: true, fullName: true } },
        lastEditedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async deletePage(pageId: string) {
    return this.prisma.docPage.delete({
      where: { id: pageId },
    });
  }

  async searchDocs(query: string, spaceId?: string) {
    if (!query || query.trim().length < 2) return [];

    const q = query.trim();
    const where: any = {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { tags: { hasSome: [q] } },
      ],
    };

    if (spaceId) {
      where.spaceId = spaceId;
    }

    const results = await this.prisma.docPage.findMany({
      where,
      take: 20,
      select: {
        id: true,
        spaceId: true,
        title: true,
        icon: true,
        tags: true,
        updatedAt: true,
        space: { select: { id: true, name: true, key: true, icon: true } },
        author: { select: { fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return results;
  }
}
