const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

// CSV Parser Helper
function parseCsvTest(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const workbook = XLSX.read(fileContent, { type: 'string' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  let scenarioId = '';
  let scenarioDesc = '';
  let responsible = '';
  let testCycle = 'UAT';
  let steps = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const firstNonEmpty = row.find((c) => String(c).trim() !== '');
    const rowStr = row.join(' | ');

    if (rowStr.includes('Test scenario ID')) {
      const idx = row.findIndex((c) => String(c).includes('Test scenario ID'));
      if (idx !== -1 && row[idx + 1]) scenarioId = String(row[idx + 1]).trim();
    }
    if (rowStr.includes('Test scenario description')) {
      const idx = row.findIndex((c) => String(c).includes('Test scenario description'));
      if (idx !== -1 && row[idx + 1]) scenarioDesc = String(row[idx + 1]).trim();
    }
    if (rowStr.includes('Test script Responsible')) {
      const idx = row.findIndex((c) => String(c).includes('Test script Responsible'));
      if (idx !== -1 && row[idx + 1]) responsible = String(row[idx + 1]).trim();
    }
    if (rowStr.includes('Test cycle')) {
      const idx = row.findIndex((c) => String(c).includes('Test cycle'));
      if (idx !== -1 && row[idx + 1]) testCycle = String(row[idx + 1]).trim();
    }

    // Step rows detection (starts with number in col 0)
    if (row[0] && !isNaN(Number(row[0])) && Number(row[0]) > 0 && row[1]) {
      const stepNo = Number(row[0]);
      const action = String(row[1]).trim();
      const tcode = String(row[2] || '').trim();
      const role = String(row[3] || '').trim();
      const executedBy = String(row[4] || '').trim();
      const condition = String(row[5] || '').trim();
      const selectionFields = String(row[6] || '').trim();
      const inputData = String(row[7] || '').trim();
      const expected = String(row[8] || 'Očakávaný stav splnený').trim();
      const docNo = String(row[9] || '').trim();
      const status = String(row[11] || 'PASSED').toUpperCase();

      const testDataStructured = JSON.stringify({
        transactionCode: tcode,
        userRole: role,
        executedBy: executedBy,
        condition: condition,
        selectionFields: selectionFields,
        inputData: inputData,
        documentNumber: docNo,
      });

      steps.push({
        stepNumber: stepNo,
        action: action,
        expectedResult: expected,
        testData: testDataStructured,
        status: status.includes('PASS') ? 'PASSED' : status.includes('FAIL') ? 'FAILED' : 'UNTESTED',
      });
    }
  }

  return {
    scenarioId: scenarioId || path.basename(filePath, '.csv').slice(0, 15),
    scenarioDesc: scenarioDesc || path.basename(filePath, '.csv'),
    responsible: responsible || 'Test Lead',
    testCycle: testCycle,
    steps,
  };
}

async function main() {
  console.log('--- Začínam napĺňanie databázy reálnymi podnikovými testami ---');

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
      role: 'ADMIN',
    },
  });

  const lead = await prisma.user.upsert({
    where: { email: 'lead@rits-workbench.local' },
    update: {},
    create: {
      email: 'lead@rits-workbench.local',
      passwordHash,
      fullName: 'Tomáš Vítek (Test Lead & Manager)',
      role: 'TEST_LEAD',
    },
  });

  const tester1 = await prisma.user.upsert({
    where: { email: 'peter.kovac@rits-workbench.local' },
    update: {},
    create: {
      email: 'peter.kovac@rits-workbench.local',
      passwordHash: testerHash,
      fullName: 'Peter Kováč (Senior QA Tester)',
      role: 'TESTER',
    },
  });

  const tester2 = await prisma.user.upsert({
    where: { email: 'viliam.kudlej@rits-workbench.local' },
    update: {},
    create: {
      email: 'viliam.kudlej@rits-workbench.local',
      passwordHash: testerHash,
      fullName: 'Viliam Kudlej (POS Tester)',
      role: 'TESTER',
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: 'business@rits-workbench.local' },
    update: {},
    create: {
      email: 'business@rits-workbench.local',
      passwordHash: testerHash,
      fullName: 'Martina Horváthová (Business Reviewer)',
      role: 'BUSINESS_REVIEWER',
    },
  });

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
  const epicWet = await prisma.testEpic.upsert({
    where: { projectId_code: { projectId: project.id, code: 'EPIC-WET-STOCK' } },
    update: {},
    create: {
      projectId: project.id,
      code: 'EPIC-WET-STOCK',
      title: 'WET - Wet Stock & Delivery Confirmation (SSR & DOMS)',
      description: 'End-to-end validation of wet product deliveries, storno confirmations, rebranding and SSR synchronization.',
      orderIndex: 1,
    },
  });

  const epicPos = await prisma.testEpic.upsert({
    where: { projectId_code: { projectId: project.id, code: 'EPIC-POS-FINANCIAL' } },
    update: {},
    create: {
      projectId: project.id,
      code: 'EPIC-POS-FINANCIAL',
      title: 'POS Financial Transactions, DriveOff & Debt Management',
      description: 'Validation of point of sale fuelings, drive-offs, cash stornos and bank card settlements.',
      orderIndex: 2,
    },
  });

  // 4. Test Suites
  let suiteUatWet = await prisma.testSuite.findFirst({
    where: { projectId: project.id, title: 'UAT Wet Stock Delivery Suite' },
  });
  if (!suiteUatWet) {
    suiteUatWet = await prisma.testSuite.create({
      data: {
        projectId: project.id,
        epicId: epicWet.id,
        title: 'UAT Wet Stock Delivery Suite',
        description: 'User acceptance testing for fuel movements and SSR interfaces.',
        orderIndex: 1,
      },
    });
  }

  let suitePos = await prisma.testSuite.findFirst({
    where: { projectId: project.id, title: 'POS Debt & Sales Execution Suite' },
  });
  if (!suitePos) {
    suitePos = await prisma.testSuite.create({
      data: {
        projectId: project.id,
        epicId: epicPos.id,
        title: 'POS Debt & Sales Execution Suite',
        description: 'Integration tests for cashier checkout, fuelling dispensations and storno receipts.',
        orderIndex: 2,
      },
    });
  }

  // 5. Parse and Insert Real Tests from test-examples
  const exampleFiles = [
    {
      file: 'test-examples/Copy of UAT_911_WET_Delivery_confirmation_cancelation_at_station_level_after_release_in_SSR.csv',
      code: 'TC_UAT_911',
      suiteId: suiteUatWet.id,
      epicId: epicWet.id,
      priority: 'HIGH',
      tags: ['WET', 'UAT', 'SSR', 'DELIVERY_CONFIRM', 'STORNO'],
    },
    {
      file: 'test-examples/Copy of UAT_933_WET_Delivery_confirmation_cancelation_at_station_level_after_release_after_process_in_SS.csv',
      code: 'TC_UAT_954',
      suiteId: suiteUatWet.id,
      epicId: epicWet.id,
      priority: 'CRITICAL',
      tags: ['WET', 'REBRANDING', 'SAP_GOB', 'DOMESTIC_EXT', 'LOGISTICS'],
    },
    {
      file: 'test-examples/ITC_941_WET_Debt_DriveOff_in_POS.csv',
      code: 'TC_ITC_941',
      suiteId: suitePos.id,
      epicId: epicPos.id,
      priority: 'HIGH',
      tags: ['POS', 'DRIVE_OFF', 'DEBT', 'CASH', 'BANK_CARD', 'STORNO'],
    },
  ];

  const createdTestCases = [];

  for (const item of exampleFiles) {
    const fullPath = path.join(__dirname, '..', item.file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`Súbor ${fullPath} nebol nájdený, preskakujem.`);
      continue;
    }

    const parsed = parseCsvTest(fullPath);

    // Delete existing if any to refresh cleanly
    const existing = await prisma.testCase.findUnique({
      where: { projectId_code: { projectId: project.id, code: item.code } },
    });
    if (existing) {
      await prisma.testCase.delete({ where: { id: existing.id } });
    }

    const testCase = await prisma.testCase.create({
      data: {
        projectId: project.id,
        suiteId: item.suiteId,
        epicId: item.epicId,
        code: item.code,
        title: parsed.scenarioDesc,
        description: `Zodpovedný: ${parsed.responsible} | Testovací Cyklus: ${parsed.testCycle}`,
        preconditions: '1. Simulátor čerpacej stanice (PumpSim / TankSim) aktívny.\n2. Integračné rozhrania SAP PO a SSR pripravené.',
        priority: item.priority,
        testType: parsed.testCycle === 'UAT' ? 'E2E' : 'INTEGRATION',
        status: 'READY',
        estimatedDurationMins: parsed.steps.length * 5,
        tags: item.tags,
        createdById: lead.id,
        steps: {
          create: parsed.steps.map((s) => ({
            stepNumber: s.stepNumber,
            action: s.action,
            expectedResult: s.expectedResult,
            testData: s.testData,
          })),
        },
      },
      include: { steps: true },
    });

    createdTestCases.push(testCase);
    console.log(`✓ Vytvorený testovací prípad: ${item.code} (${parsed.steps.length} krokov)`);
  }

  // 6. Pre-create Live Test Runs
  const existingRun = await prisma.testRun.findFirst({
    where: { projectId: project.id, title: 'Release 2.5 - WET & POS Comprehensive Matrix' },
  });
  if (existingRun) {
    await prisma.testRun.delete({ where: { id: existingRun.id } });
  }

  const activeRun = await prisma.testRun.create({
    data: {
      projectId: project.id,
      title: 'Release 2.5 - WET & POS Comprehensive Matrix',
      environment: 'STAGING',
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      createdById: lead.id,
    },
  });

  for (const tc of createdTestCases) {
    const caseExec = await prisma.testCaseExecution.create({
      data: {
        testRunId: activeRun.id,
        testCaseId: tc.id,
        status: 'IN_PROGRESS',
        assignedToId: tester1.id,
      },
    });

    for (const step of tc.steps) {
      await prisma.testStepExecution.create({
        data: {
          testCaseExecutionId: caseExec.id,
          testCaseStepId: step.id,
          status: step.stepNumber === 1 ? 'PASSED' : step.stepNumber === 2 ? 'IN_PROGRESS' : 'UNTESTED',
          assignedToId: step.stepNumber % 2 === 0 ? tester2.id : tester1.id,
          actualResult: step.stepNumber === 1 ? 'Overené v systéme bez chybových hlášok.' : null,
          executedById: step.stepNumber === 1 ? tester1.id : null,
          durationSecs: step.stepNumber === 1 ? 85 : 0,
        },
      });
    }
  }

  // 7. Graph Architecture Objects & Relationships
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

  const ssr = await prisma.graphObject.upsert({
    where: { objectId: 'SYS_SSR' },
    update: {},
    create: {
      objectId: 'SYS_SSR',
      objectType: 'system',
      name: 'SSR Secondary Settlement Reconciliation',
      displayName: 'SSR Accounting Hub',
      domain: 'WET',
      status: 'confirmed',
      description: 'Secondary settlement and fuel delivery reconciliation.',
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

  // Relationships
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
    where: { relationshipId: 'REL_PO_SSR' },
    update: {},
    create: {
      relationshipId: 'REL_PO_SSR',
      sourceObjectId: sapPo.objectId,
      targetObjectId: ssr.objectId,
      relationshipType: 'sends_to',
      communicationType: 'IDoc',
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

  // Link Test Cases to Graph Objects
  for (const tc of createdTestCases) {
    await prisma.testCaseGraphLink.upsert({
      where: { testCaseId_graphObjectId: { testCaseId: tc.id, graphObjectId: ifRits009.objectId } },
      update: {},
      create: {
        testCaseId: tc.id,
        graphObjectId: ifRits009.objectId,
        relationshipType: 'validates',
      },
    });
  }

  console.log('✓ Všetky reálne testy, testovacie behy a grafová topológia boli úspešne inicializované!');
}

main()
  .catch((e) => {
    console.error('Chyba seedu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
