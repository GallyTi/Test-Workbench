import { PrismaClient, UserRole, PriorityLevel, TestTypeEnum, TestStatusEnum } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial system data...');

  // 1. Users
  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
  const testerHash = await bcrypt.hash('TesterPassword123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@rits-workbench.local' },
    update: {},
    create: {
      email: 'admin@rits-workbench.local',
      passwordHash,
      fullName: 'System Administrator',
      role: UserRole.ADMIN,
    },
  });

  const lead = await prisma.user.upsert({
    where: { email: 'lead@rits-workbench.local' },
    update: {},
    create: {
      email: 'lead@rits-workbench.local',
      passwordHash,
      fullName: 'Elena Vargová (Test Lead)',
      role: UserRole.TEST_LEAD,
    },
  });

  const tester1 = await prisma.user.upsert({
    where: { email: 'peter.kovac@rits-workbench.local' },
    update: {},
    create: {
      email: 'peter.kovac@rits-workbench.local',
      passwordHash: testerHash,
      fullName: 'Peter Kováč (Senior Tester)',
      role: UserRole.TESTER,
    },
  });

  const business = await prisma.user.upsert({
    where: { email: 'business@rits-workbench.local' },
    update: {},
    create: {
      email: 'business@rits-workbench.local',
      passwordHash: testerHash,
      fullName: 'Martina Horváthová (Business Reviewer)',
      role: UserRole.BUSINESS_REVIEWER,
    },
  });

  console.log('Created users:', { admin: admin.email, lead: lead.email, tester: tester1.email });

  // 2. Project
  const project = await prisma.project.upsert({
    where: { key: 'RITS' },
    update: {},
    create: {
      key: 'RITS',
      name: 'RITS / HIVE2 Integration Platform',
      description: 'Centralized enterprise testing and architecture workbench for retail & integration systems.',
    },
  });

  // 3. Epics
  const epicPos = await prisma.testEpic.upsert({
    where: { projectId_code: { projectId: project.id, code: 'EPIC-POS-INTEGRATION' } },
    update: {},
    create: {
      projectId: project.id,
      code: 'EPIC-POS-INTEGRATION',
      title: 'POS to Central SAP CAR Integration',
      description: 'Validation of real-time sales transactions, delivery confirmations and inventory updates.',
      orderIndex: 1,
    },
  });

  // 4. Test Suite
  const suiteWet = await prisma.testSuite.create({
    data: {
      projectId: project.id,
      epicId: epicPos.id,
      title: 'WET - Wet Stock & Delivery Confirmation Suite',
      description: 'End-to-end smoke and integration tests for wet stock flow.',
      orderIndex: 1,
    },
  });

  // 5. Test Case + Steps
  const tc001 = await prisma.testCase.upsert({
    where: { projectId_code: { projectId: project.id, code: 'TC_WET_001' } },
    update: {},
    create: {
      projectId: project.id,
      suiteId: suiteWet.id,
      epicId: epicPos.id,
      code: 'TC_WET_001',
      title: 'Validate Delivery Confirmation Flow (DOMS -> SAP PO -> SAP CAR)',
      description: 'Verify that delivery confirmation event triggers IDoc ORDERS05 and replicates data without schema errors.',
      preconditions: '1. Source DOMS controller online.\n2. SAP PO channel WET_DELIV_01 active.\n3. Test station ID 4021 prepared.',
      priority: PriorityLevel.HIGH,
      testType: TestTypeEnum.SMOKE,
      status: TestStatusEnum.READY,
      estimatedDurationMins: 20,
      tags: ['WET', 'SAP_PO', 'SMOKE_2026', 'DOMS'],
      createdById: lead.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            action: 'Simulate delivery confirmation event in DOMS test simulator for station 4021.',
            expectedResult: 'HTTP 200 OK returned by DOMS edge connector with transaction ID.',
            testData: '{"station_id": "4021", "fuel_type": "DIESEL_PLUS", "volume_liters": 1250.50}',
          },
          {
            stepNumber: 2,
            action: 'Check SAP PO Message Monitor for interface IF_RITS_009.',
            expectedResult: 'Message status is SUCCESSFUL (Green). No mapping exceptions.',
            testData: 'Interface: IF_RITS_009, Payload: XML_DELIVERY_CONFIRM',
          },
          {
            stepNumber: 3,
            action: 'Query SAP CAR /POSDW/TLOGF table for replicated transaction.',
            expectedResult: 'Record exists with matching station_id and status CONFIRMED.',
            testData: 'SELECT * FROM /POSDW/TLOGF WHERE TRANSACTION_ID = ...',
          },
        ],
      },
    },
  });

  // 6. Graph Objects (Architecture Blueprint)
  const doms = await prisma.graphObject.upsert({
    where: { objectId: 'SYS_DOMS' },
    update: {},
    create: {
      objectId: 'SYS_DOMS',
      objectType: 'system',
      name: 'DOMS Forecourt Controller',
      displayName: 'DOMS POS Controller',
      domain: 'POS',
      status: 'confirmed',
      description: 'Forecourt fuel automation and dispenser management system.',
    },
  });

  const sapPo = await prisma.graphObject.upsert({
    where: { objectId: 'SYS_SAP_PO' },
    update: {},
    create: {
      objectId: 'SYS_SAP_PO',
      objectType: 'system',
      name: 'SAP Process Orchestration',
      displayName: 'SAP PO Middleware',
      domain: 'Integration',
      status: 'confirmed',
      description: 'Central enterprise integration hub.',
    },
  });

  const sapCar = await prisma.graphObject.upsert({
    where: { objectId: 'SYS_SAP_CAR' },
    update: {},
    create: {
      objectId: 'SYS_SAP_CAR',
      objectType: 'system',
      name: 'SAP Customer Activity Repository',
      displayName: 'SAP CAR',
      domain: 'RITS',
      status: 'confirmed',
      description: 'Central retail data repository.',
    },
  });

  const ifRits009 = await prisma.graphObject.upsert({
    where: { objectId: 'IF_RITS_009' },
    update: {},
    create: {
      objectId: 'IF_RITS_009',
      objectType: 'interface',
      name: 'IF_RITS_009 Delivery Confirmation',
      displayName: 'IF_RITS_009',
      domain: 'WET',
      status: 'confirmed',
      description: 'Interface transferring wet stock confirmations from DOMS to SAP PO.',
    },
  });

  // Graph Relationships
  await prisma.graphRelationship.upsert({
    where: { relationshipId: 'REL_DOMS_PO' },
    update: {},
    create: {
      relationshipId: 'REL_DOMS_PO',
      sourceObjectId: doms.objectId,
      targetObjectId: sapPo.objectId,
      relationshipType: 'sends_to',
      communicationType: 'REST_API',
      dataType: 'transactional_data',
      status: 'confirmed',
    },
  });

  await prisma.graphRelationship.upsert({
    where: { relationshipId: 'REL_PO_CAR' },
    update: {},
    create: {
      relationshipId: 'REL_PO_CAR',
      sourceObjectId: sapPo.objectId,
      targetObjectId: sapCar.objectId,
      relationshipType: 'sends_to',
      communicationType: 'SAP_PO',
      dataType: 'transactional_data',
      status: 'confirmed',
    },
  });

  // Link Test Case to Graph Interface
  await prisma.testCaseGraphLink.upsert({
    where: { testCaseId_graphObjectId: { testCaseId: tc001.id, graphObjectId: ifRits009.objectId } },
    update: {},
    create: {
      testCaseId: tc001.id,
      graphObjectId: ifRits009.objectId,
      relationshipType: 'validates',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
