import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TestRunsService } from './test-runs.service';
import { CreateTestRunDto, UpdateStepExecutionDto } from './dto/test-run.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Testovacie Behy a Exekúcia (Test Runs & Execution)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('test-runs')
export class TestRunsController {
  constructor(private readonly testRunsService: TestRunsService) {}

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Zoznam všetkých testovacích behov projektu so štatistikami úspešnosti' })
  async findAll(@Param('projectId') projectId: string) {
    return this.testRunsService.findAll(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail testovacieho behu so stavmi všetkých krokov a priradenými testermi' })
  async findOne(@Param('id') id: string) {
    return this.testRunsService.findOne(id);
  }

  @Post('project/:projectId')
  @ApiOperation({ summary: 'Spustenie / vytvorenie nového testovacieho behu' })
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTestRunDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.testRunsService.create(projectId, dto, userId);
  }

  @Patch('steps/:stepExecutionId')
  @ApiOperation({ summary: 'Aktualizácia stavu testovacieho kroku (PASSED, FAILED, BLOCKED, atď.), času a priradenia' })
  async updateStep(
    @Param('stepExecutionId') stepExecutionId: string,
    @Body() dto: UpdateStepExecutionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.testRunsService.updateStepExecution(stepExecutionId, dto, userId);
  }
}
