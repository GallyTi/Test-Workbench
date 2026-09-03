import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocsService } from './docs.service';
import {
  CreateDocSpaceDto,
  UpdateDocSpaceDto,
  CreateDocPageDto,
  UpdateDocPageDto,
} from './dto/docs.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Dokumentácia a Znalostná Báza (Confluence Docs & Knowledge Base)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('docs')
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  // -------------------------------------------------------------
  // Spaces
  // -------------------------------------------------------------

  @Get('spaces')
  @ApiOperation({ summary: 'Zoznam dokumentačných priestorov (Spaces)' })
  async findSpaces(@Query('projectId') projectId?: string) {
    return this.docsService.findSpaces(projectId);
  }

  @Get('spaces/:spaceId')
  @ApiOperation({ summary: 'Detail priestoru s hierarchickým stromom stránok' })
  async findSpaceWithTree(@Param('spaceId') spaceId: string) {
    return this.docsService.findSpaceWithTree(spaceId);
  }

  @Post('spaces')
  @ApiOperation({ summary: 'Vytvorenie nového dokumentačného priestoru' })
  async createSpace(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDocSpaceDto,
  ) {
    return this.docsService.createSpace(userId, dto);
  }

  @Patch('spaces/:spaceId')
  @ApiOperation({ summary: 'Úprava dokumentačného priestoru' })
  async updateSpace(
    @Param('spaceId') spaceId: string,
    @Body() dto: UpdateDocSpaceDto,
  ) {
    return this.docsService.updateSpace(spaceId, dto);
  }

  @Delete('spaces/:spaceId')
  @ApiOperation({ summary: 'Odstránenie dokumentačného priestoru' })
  async deleteSpace(@Param('spaceId') spaceId: string) {
    return this.docsService.deleteSpace(spaceId);
  }

  // -------------------------------------------------------------
  // Search
  // -------------------------------------------------------------

  @Get('search')
  @ApiOperation({ summary: 'Fulltextové vyhľadávanie v dokumentácii' })
  async searchDocs(
    @Query('q') query: string,
    @Query('spaceId') spaceId?: string,
  ) {
    return this.docsService.searchDocs(query, spaceId);
  }

  // -------------------------------------------------------------
  // Pages
  // -------------------------------------------------------------

  @Get('pages/:pageId')
  @ApiOperation({ summary: 'Detail dokumentačnej stránky s breadcrumbs a revíziami' })
  async findPage(@Param('pageId') pageId: string) {
    return this.docsService.findPage(pageId);
  }

  @Post('pages')
  @ApiOperation({ summary: 'Vytvorenie novej stránky (podpora stromového vnorenia)' })
  async createPage(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDocPageDto,
  ) {
    return this.docsService.createPage(userId, dto);
  }

  @Patch('pages/:pageId')
  @ApiOperation({ summary: 'Úprava stránky s automatickým ukladaním histórie revízií' })
  async updatePage(
    @Param('pageId') pageId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateDocPageDto,
  ) {
    return this.docsService.updatePage(pageId, userId, dto);
  }

  @Delete('pages/:pageId')
  @ApiOperation({ summary: 'Odstránenie stránky vrátane podstránok' })
  async deletePage(@Param('pageId') pageId: string) {
    return this.docsService.deletePage(pageId);
  }
}
