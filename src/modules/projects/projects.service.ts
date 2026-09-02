import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateProjectDto, CreateEpicDto, CreateSuiteDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // Projects
  async findAllProjects() {
    return this.prisma.project.findMany({
      where: { isArchived: false },
      include: {
        _count: {
          select: {
            testCases: true,
            testRuns: true,
            epics: true,
            suites: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findProjectById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        epics: {
          include: {
            suites: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        suites: {
          where: { parentSuiteId: null },
          include: {
            childSuites: true,
            _count: { select: { testCases: true } },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projekt nebol nájdený');
    }
    return project;
  }

  async createProject(dto: CreateProjectDto) {
    const existing = await this.prisma.project.findUnique({
      where: { key: dto.key.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Projekt s kľúčom ${dto.key} už existuje`);
    }

    return this.prisma.project.create({
      data: {
        key: dto.key.toUpperCase(),
        name: dto.name,
        description: dto.description,
      },
    });
  }

  // Epics
  async createEpic(projectId: string, dto: CreateEpicDto) {
    await this.findProjectById(projectId);
    return this.prisma.testEpic.create({
      data: {
        projectId,
        code: dto.code.toUpperCase(),
        title: dto.title,
        description: dto.description,
      },
    });
  }

  // Suites
  async createSuite(projectId: string, dto: CreateSuiteDto) {
    await this.findProjectById(projectId);
    return this.prisma.testSuite.create({
      data: {
        projectId,
        epicId: dto.epicId,
        parentSuiteId: dto.parentSuiteId,
        title: dto.title,
        description: dto.description,
      },
    });
  }

  // Epics hierarchy with sub-epics (suites) and test cases
  async findEpicsWithHierarchy(projectId: string) {
    return this.prisma.testEpic.findMany({
      where: { projectId },
      include: {
        suites: {
          include: {
            testCases: {
              include: {
                steps: { select: { id: true, status: true } },
              },
              orderBy: { code: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        testCases: {
          where: { suiteId: null },
          include: {
            steps: { select: { id: true, status: true } },
          },
          orderBy: { code: 'asc' },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });
  }
}
