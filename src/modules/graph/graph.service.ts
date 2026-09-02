import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateGraphObjectDto, CreateGraphRelationshipDto, FindPathDto } from './dto/graph.dto';

@Injectable()
export class GraphService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllObjects(domain?: string, objectType?: string) {
    return this.prisma.graphObject.findMany({
      where: {
        ...(domain && { domain }),
        ...(objectType && { objectType }),
      },
      include: {
        outgoingRels: true,
        incomingRels: true,
      },
      orderBy: { objectId: 'asc' },
    });
  }

  async getAllRelationships() {
    return this.prisma.graphRelationship.findMany({
      include: {
        sourceObject: { select: { objectId: true, name: true, objectType: true, domain: true } },
        targetObject: { select: { objectId: true, name: true, objectType: true, domain: true } },
      },
    });
  }

  async createObject(dto: CreateGraphObjectDto) {
    const existing = await this.prisma.graphObject.findUnique({
      where: { objectId: dto.objectId },
    });
    if (existing) {
      throw new ConflictException(`Objekt s kódom ${dto.objectId} už existuje`);
    }

    return this.prisma.graphObject.create({
      data: {
        objectId: dto.objectId,
        objectType: dto.objectType,
        name: dto.name,
        domain: dto.domain,
        status: dto.status || 'draft',
        description: dto.description,
      },
    });
  }

  async createRelationship(dto: CreateGraphRelationshipDto) {
    return this.prisma.graphRelationship.create({
      data: {
        relationshipId: dto.relationshipId,
        sourceObjectId: dto.sourceObjectId,
        targetObjectId: dto.targetObjectId,
        relationshipType: dto.relationshipType,
        communicationType: dto.communicationType,
        dataType: dto.dataType,
      },
    });
  }

  // BFS Pathfinding medzi dvoma objektmi
  async findPath(dto: FindPathDto) {
    const relationships = await this.prisma.graphRelationship.findMany();

    const adjacencyMap = new Map<string, Array<{ target: string; rel: any }>>();
    for (const rel of relationships) {
      if (!adjacencyMap.has(rel.sourceObjectId)) adjacencyMap.set(rel.sourceObjectId, []);
      adjacencyMap.get(rel.sourceObjectId)!.push({ target: rel.targetObjectId, rel });
    }

    const queue: Array<{ current: string; path: string[]; edges: any[] }> = [
      { current: dto.source, path: [dto.source], edges: [] },
    ];
    const visited = new Set<string>([dto.source]);

    while (queue.length > 0) {
      const { current, path, edges } = queue.shift()!;

      if (current === dto.target) {
        return {
          found: true,
          pathLength: edges.length,
          nodes: path,
          edges,
        };
      }

      const neighbors = adjacencyMap.get(current) || [];
      for (const { target, rel } of neighbors) {
        if (!visited.has(target)) {
          visited.add(target);
          queue.push({
            current: target,
            path: [...path, target],
            edges: [...edges, rel],
          });
        }
      }
    }

    return { found: false, message: `Nebola nájdená cesta medzi ${dto.source} a ${dto.target}` };
  }

  // Regresná analýza dopadu (Impact Analysis)
  async getImpactedTestCases(objectId: string) {
    // 1. Nájdeme všetky susedné uzly v hĺbke 1 a 2
    const directRels = await this.prisma.graphRelationship.findMany({
      where: {
        OR: [{ sourceObjectId: objectId }, { targetObjectId: objectId }],
      },
    });

    const relatedObjectIds = new Set<string>([objectId]);
    directRels.forEach((r) => {
      relatedObjectIds.add(r.sourceObjectId);
      relatedObjectIds.add(r.targetObjectId);
    });

    // 2. Nájdeme všetky test casy nalinkované na tieto objekty
    const testCaseLinks = await this.prisma.testCaseGraphLink.findMany({
      where: {
        graphObjectId: { in: Array.from(relatedObjectIds) },
      },
      include: {
        testCase: {
          include: {
            steps: true,
            suite: true,
            epic: true,
          },
        },
      },
    });

    const impactedTestCases = testCaseLinks.map((link) => ({
      testCaseId: link.testCase.id,
      code: link.testCase.code,
      title: link.testCase.title,
      priority: link.testCase.priority,
      suiteTitle: link.testCase.suite?.title,
      linkedThroughObject: link.graphObjectId,
      relationshipType: link.relationshipType,
      stepsCount: link.testCase.steps.length,
    }));

    return {
      targetObjectId: objectId,
      affectedObjectsInGraph: Array.from(relatedObjectIds),
      impactedTestCasesCount: impactedTestCases.length,
      impactedTestCases,
    };
  }
}
