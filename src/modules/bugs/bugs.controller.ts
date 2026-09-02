import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BugsService } from './bugs.service';
import { CreateBugDto } from './dto/bug.dto';
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
}
