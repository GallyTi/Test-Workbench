import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BugsService } from './bugs.service';
import { CreateBugDto, UpdateBugDto } from './dto/bug.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Chyby a Incidenty (Bugs & Defect Reports)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bugs')
export class BugsController {
  constructor(private readonly bugsService: BugsService) {}

  @Post()
  @ApiOperation({ summary: 'Vytvorenie nového bugu priamo z testovacieho kroku (Bug Button)' })
  async create(@Body() dto: CreateBugDto, @CurrentUser('id') userId: string) {
    return this.bugsService.create(dto, userId);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Zoznam všetkých nahlásených bugov v projekte s kontextom krokov' })
  async findByProject(@Param('projectId') projectId: string) {
    return this.bugsService.findByProject(projectId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Aktualizácia stavu defektu (OPEN, IN_PROGRESS, RESOLVED, CLOSED) a Jira ticketu' })
  async update(@Param('id') id: string, @Body() dto: UpdateBugDto) {
    return this.bugsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Vymazanie evidovaného defektu' })
  async delete(@Param('id') id: string) {
    return this.bugsService.delete(id);
  }
}
