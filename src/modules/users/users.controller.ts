import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Používatelia (Users & Schvaľovanie)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Zoznam všetkých používateľov' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('pending')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Zoznam čakajúcich registrácií na schválenie (len ADMIN)' })
  async findPending() {
    return this.usersService.findPending();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail používateľa podľa ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Schválenie registrácie používateľa a priradenie role (len ADMIN)' })
  async approve(
    @Param('id') id: string,
    @Body('role') role?: UserRole,
  ) {
    return this.usersService.approveUser(id, role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Aktualizácia používateľa a zmena role (len ADMIN)' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Odstránenie alebo zamietnutie používateľa (len ADMIN)' })
  async remove(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
