import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TimersService } from './timers.service';
import { StartStepTimerDto, StopStepTimerDto } from './dto/timer.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Časovače a Bottleneck SLA (Timers & Bottlenecks)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timers')
export class TimersController {
  constructor(private readonly timersService: TimersService) {}

  @Post('start')
  @ApiOperation({ summary: 'Spustenie merania času testera na konkrétnom kroku' })
  async startTimer(@Body() dto: StartStepTimerDto, @CurrentUser('id') userId: string) {
    return this.timersService.startTimer(dto, userId);
  }

  @Post('stop')
  @ApiOperation({ summary: 'Zastavenie merania času a zaznamenanie trvania' })
  async stopTimer(@Body() dto: StopStepTimerDto) {
    return this.timersService.stopTimer(dto);
  }

  @Get('admin/bottlenecks/project/:projectId')
  @ApiOperation({ summary: 'Admin report: Kto ako dlho robí, na koho sa čaká a zoznam blokovaných krokov' })
  async getBottlenecks(@Param('projectId') projectId: string) {
    return this.timersService.getAdminBottleneckReport(projectId);
  }
}
