import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GraphService } from './graph.service';
import { CreateGraphObjectDto, CreateGraphRelationshipDto, FindPathDto } from './dto/graph.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Architektúrny Graf a Prepojenia (Architecture Graph & Pathfinding)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('graph')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get('objects')
  @ApiOperation({ summary: 'Zoznam všetkých architektúrnych objektov (systémy, procesy, rozhrania)' })
  @ApiQuery({ name: 'domain', required: false })
  @ApiQuery({ name: 'objectType', required: false })
  async getObjects(@Query('domain') domain?: string, @Query('objectType') objectType?: string) {
    return this.graphService.getAllObjects(domain, objectType);
  }

  @Get('relationships')
  @ApiOperation({ summary: 'Zoznam všetkých relácií a dátových tokov medzi objektmi' })
  async getRelationships() {
    return this.graphService.getAllRelationships();
  }

  @Post('objects')
  @Roles(UserRole.ADMIN, UserRole.TEST_LEAD)
  @ApiOperation({ summary: 'Vytvorenie nového uzla v architektúrnom grafe' })
  async createObject(@Body() dto: CreateGraphObjectDto) {
    return this.graphService.createObject(dto);
  }

  @Post('relationships')
  @Roles(UserRole.ADMIN, UserRole.TEST_LEAD)
  @ApiOperation({ summary: 'Vytvorenie novej hrany (sends_to, communicates_with) v grafe' })
  async createRelationship(@Body() dto: CreateGraphRelationshipDto) {
    return this.graphService.createRelationship(dto);
  }

  @Post('path')
  @ApiOperation({ summary: 'Vyhľadanie prepojovacej integračnej cesty medzi dvoma systémami (napr. DOMS -> SAP CAR)' })
  async findPath(@Body() dto: FindPathDto) {
    return this.graphService.findPath(dto);
  }

  @Get('impact/:objectId')
  @ApiOperation({ summary: 'Regresná analýza dopadu: zistenie všetkých test casov ovplyvnených zmenou rozhrania/systému' })
  async getImpact(@Param('objectId') objectId: string) {
    return this.graphService.getImpactedTestCases(objectId);
  }
}
