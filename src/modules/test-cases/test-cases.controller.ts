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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TestCasesService } from './test-cases.service';
import { CreateTestCaseDto } from './dto/test-case.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { StepStatusEnum } from '@prisma/client';

@ApiTags('Testovacie Scenáre (Test Cases & Steps)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/test-cases')
export class TestCasesController {
  constructor(private readonly testCasesService: TestCasesService) {}

  @Get()
  @ApiOperation({ summary: 'Zoznam testovacích prípadov v projekte s filtrami' })
  @ApiQuery({ name: 'suiteId', required: false })
  @ApiQuery({ name: 'epicId', required: false })
  @ApiQuery({ name: 'tag', required: false })
  async findAll(
    @Param('projectId') projectId: string,
    @Query('suiteId') suiteId?: string,
    @Query('epicId') epicId?: string,
    @Query('tag') tag?: string,
  ) {
    return this.testCasesService.findAll(projectId, { suiteId, epicId, tag });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail testovacieho prípadu vrátane krokov a vzájomných prepojení' })
  async findOne(@Param('id') id: string) {
    return this.testCasesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Vytvorenie nového testovacieho prípadu s krokmi' })
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTestCaseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.testCasesService.create(projectId, dto, userId);
  }

  @Patch('steps/:stepId')
  @ApiOperation({ summary: 'Priama úprava stavu, akcie, výsledku, vstupných dát alebo priradenia testovacieho kroku' })
  async updateStep(
    @Param('stepId') stepId: string,
    @Body()
    body: {
      status?: StepStatusEnum;
      actualResult?: string;
      assignedToId?: string;
      requiresProofPhoto?: boolean;
      action?: string;
      expectedResult?: string;
      testData?: string;
      stepNumber?: number;
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.testCasesService.updateStep(stepId, body, userId);
  }

  @Post(':id/steps')
  @ApiOperation({ summary: 'Pridanie nového testovacieho kroku s akciou, činnosťou a vstupnými dátami' })
  async addStep(
    @Param('id') testCaseId: string,
    @Body()
    body: {
      action: string;
      expectedResult: string;
      testData?: string;
      stepNumber?: number;
      assignedToId?: string;
      requiresProofPhoto?: boolean;
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.testCasesService.addStep(testCaseId, body, userId);
  }

  @Delete('steps/:stepId')
  @ApiOperation({ summary: 'Zmazanie testovacieho kroku zo scenára' })
  async deleteStep(
    @Param('stepId') stepId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.testCasesService.deleteStep(stepId, userId);
  }

  @Post(':id/relationships')
  @ApiOperation({ summary: 'Prepojenie testovacieho scenára s iným scenárom (Cross-connections)' })
  async createRelationship(
    @Param('id') sourceCaseId: string,
    @Body() body: { targetCaseId: string; linkType: string },
  ) {
    return this.testCasesService.createRelationship(sourceCaseId, body.targetCaseId, body.linkType);
  }

  @Delete('relationships/:relId')
  @ApiOperation({ summary: 'Zmazanie prepojenia medzi scenármi' })
  async deleteRelationship(@Param('relId') relId: string) {
    return this.testCasesService.deleteRelationship(relId);
  }

  @Post(':id/reset')
  @ApiOperation({ summary: 'Zresetovanie celého testovacieho scenára (všetky kroky na UNTESTED)' })
  async reset(@Param('id') id: string) {
    return this.testCasesService.resetTestCase(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Zmazanie testovacieho prípadu' })
  async delete(@Param('id') id: string) {
    return this.testCasesService.delete(id);
  }
}
