import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, CreateEpicDto, CreateSuiteDto } from './dto/project.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Projekty, Epicy a Sady (Projects & Suites)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Zoznam všetkých projektov' })
  async findAll() {
    return this.projectsService.findAllProjects();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail projektu so štruktúrou epicov a sád' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findProjectById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEST_LEAD)
  @ApiOperation({ summary: 'Vytvorenie nového projektu' })
  async createProject(@Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(dto);
  }

  @Get(':projectId/epics')
  @ApiOperation({ summary: 'Hierarchický zoznam Epicov, Sub-Epicov (Suites) a ich testov' })
  async findEpics(@Param('projectId') projectId: string) {
    return this.projectsService.findEpicsWithHierarchy(projectId);
  }

  @Post(':projectId/epics')
  @Roles(UserRole.ADMIN, UserRole.TEST_LEAD)
  @ApiOperation({ summary: 'Vytvorenie nového testovacieho Epicu' })
  async createEpic(@Param('projectId') projectId: string, @Body() dto: CreateEpicDto) {
    return this.projectsService.createEpic(projectId, dto);
  }

  @Post(':projectId/suites')
  @Roles(UserRole.ADMIN, UserRole.TEST_LEAD)
  @ApiOperation({ summary: 'Vytvorenie novej testovacej sady (Suite)' })
  async createSuite(@Param('projectId') projectId: string, @Body() dto: CreateSuiteDto) {
    return this.projectsService.createSuite(projectId, dto);
  }
}
