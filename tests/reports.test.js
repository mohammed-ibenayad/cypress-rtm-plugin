// tests/reports.test.js
const RTMReportGenerator = require('../src/reports');
const { CypressRTM } = require('../src/core');
const { 
  TEST_TYPES, 
  TEST_PRIORITIES, 
  REQUIREMENT_TYPES, 
  REQUIREMENT_PRIORITIES 
} = require('../src/constants');
const path = require('path');
const fs = require('fs').promises;

describe('RTMReportGenerator', () => {
  let rtm;
  let reportGenerator;
  const outputPath = path.join(__dirname, 'output');

  beforeEach(async () => {
    // Create RTM instance with test configuration
    rtm = new CypressRTM({
      outputPath
    });

    // Setup test data
    setupTestData(rtm);

    // Create report generator
    reportGenerator = new RTMReportGenerator(rtm);

    // Ensure output directory exists
    await fs.mkdir(outputPath, { recursive: true }).catch(() => {});
  });

  afterEach(async () => {
    // Clean up test files
    await fs.rm(outputPath, { recursive: true, force: true }).catch(() => {});
  });

  function setupTestData(rtm) {
    // Add requirements
    rtm.requirements = new Map([
      ['REQ-001', {
        id: 'REQ-001',
        title: 'Login Functionality',
        type: REQUIREMENT_TYPES.FUNCTIONAL,
        priority: REQUIREMENT_PRIORITIES.P0,
        description: 'Users must be able to login'
      }],
      ['REQ-002', {
        id: 'REQ-002',
        title: 'Password Security',
        type: REQUIREMENT_TYPES.SECURITY,
        priority: REQUIREMENT_PRIORITIES.P1,
        description: 'Passwords must be encrypted'
      }]
    ]);

    // Add user stories
    rtm.userStories = new Map([
      ['US-001', {
        id: 'US-001',
        title: 'User Login',
        description: 'As a user, I want to login',
        linkedRequirements: ['REQ-001']
      }],
      ['US-002', {
        id: 'US-002',
        title: 'Password Reset',
        description: 'As a user, I want to reset my password',
        linkedRequirements: ['REQ-001', 'REQ-002']
      }]
    ]);

    // Add test cases
    rtm.testCases = new Map([
      ['TC-001', {
        id: 'TC-001',
        title: 'Successful Login',
        type: TEST_TYPES.E2E,
        priority: TEST_PRIORITIES.P1,
        requirements: ['REQ-001'],
        userStories: ['US-001']
      }],
      ['TC-002', {
        id: 'TC-002',
        title: 'Password Encryption',
        type: TEST_TYPES.SECURITY,
        priority: TEST_PRIORITIES.P1,
        requirements: ['REQ-002'],
        userStories: ['US-002']
      }]
    ]);

    // Setup coverage data
    rtm.coverage = {
      requirements: new Map([
        ['REQ-001', new Set(['TC-001'])],
        ['REQ-002', new Set(['TC-002'])]
      ]),
      stories: new Map([
        ['US-001', new Set(['TC-001'])],
        ['US-002', new Set(['TC-002'])]
      ]),
      types: {
        requirements: new Map([
          [REQUIREMENT_TYPES.FUNCTIONAL, new Set(['TC-001'])],
          [REQUIREMENT_TYPES.SECURITY, new Set(['TC-002'])]
        ]),
        tests: new Map([
          [TEST_TYPES.E2E, new Set(['TC-001'])],
          [TEST_TYPES.SECURITY, new Set(['TC-002'])]
        ])
      }
    };
  }

  test('should generate summary correctly', () => {
    const summary = reportGenerator.generateSummary();
    
    expect(summary).toEqual({
      totalRequirements: 2,
      totalUserStories: 2,
      totalTestCases: 2,
      coverage: {
        requirements: {
          covered: 2,
          percentage: 100
        },
        userStories: {
          covered: 2,
          percentage: 100
        }
      }
    });
  });

  test('should calculate requirement type coverage correctly', () => {
    const coverage = reportGenerator.calculateRequirementTypeCoverage();
    
    expect(coverage).toEqual({
      [REQUIREMENT_TYPES.FUNCTIONAL]: {
        total: 1,
        covered: 1,
        percentage: 100
      },
      [REQUIREMENT_TYPES.SECURITY]: {
        total: 1,
        covered: 1,
        percentage: 100
      }
    });
  });

  test('should calculate test type coverage correctly', () => {
    const coverage = reportGenerator.calculateTestTypeCoverage();
    
    expect(coverage).toEqual({
      [TEST_TYPES.E2E]: {
        total: 1,
        requirements: 1
      },
      [TEST_TYPES.SECURITY]: {
        total: 1,
        requirements: 1
      }
    });
  });

  test('should calculate priority coverage correctly', () => {
    const coverage = reportGenerator.calculatePriorityCoverage();
    
    expect(coverage).toEqual({
      [REQUIREMENT_PRIORITIES.P0]: {
        total: 1,
        covered: 1,
        percentage: 100
      },
      [REQUIREMENT_PRIORITIES.P1]: {
        total: 1,
        covered: 1,
        percentage: 100
      }
    });
  });

  test('should generate traceability matrix correctly', () => {
    const matrix = reportGenerator.generateTraceabilityMatrix();
    
    expect(matrix).toEqual({
      requirementsToTests: {
        'REQ-001': ['TC-001'],
        'REQ-002': ['TC-002']
      },
      storiesToRequirements: {
        'US-001': ['REQ-001'],
        'US-002': ['REQ-001', 'REQ-002']
      },
      storiesToTests: {
        'US-001': ['TC-001'],
        'US-002': ['TC-002']
      }
    });
  });

  test('should get requirements details correctly', () => {
    const details = reportGenerator.getRequirementsDetails();
    
    expect(details).toHaveLength(2);
    expect(details[0]).toMatchObject({
      id: 'REQ-001',
      coverage: {
        testCases: ['TC-001'],
        isCovered: true
      }
    });
  });

  test('should get user stories details correctly', () => {
    const details = reportGenerator.getUserStoriesDetails();
    
    expect(details).toHaveLength(2);
    expect(details[0]).toMatchObject({
      id: 'US-001',
      coverage: {
        testCases: ['TC-001'],
        requirements: ['REQ-001'],
        isCovered: true
      }
    });
  });

  test('should get test cases details correctly', () => {
    const details = reportGenerator.getTestCasesDetails();
    
    expect(details).toHaveLength(2);
    expect(details[0]).toMatchObject({
      id: 'TC-001',
      coverage: {
        requirements: ['REQ-001'],
        userStories: ['US-001']
      }
    });
  });

  test('should generate JSON report file', async () => {
    await reportGenerator.generateReports();
    
    const jsonPath = path.join(outputPath, 'rtm-report.json');
    const exists = await fs.access(jsonPath)
      .then(() => true)
      .catch(() => false);
    
    expect(exists).toBe(true);
    
    const content = await fs.readFile(jsonPath, 'utf8');
    const report = JSON.parse(content);
    
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('coverage');
    expect(report).toHaveProperty('traceabilityMatrix');
    expect(report).toHaveProperty('details');
  });

  test('should generate HTML report file', async () => {
    await reportGenerator.generateReports();
    
    const htmlPath = path.join(outputPath, 'rtm-report.html');
    const exists = await fs.access(htmlPath)
      .then(() => true)
      .catch(() => false);
    
    expect(exists).toBe(true);
    
    const content = await fs.readFile(htmlPath, 'utf8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('Requirements Traceability Matrix Report');
  });

  test('should handle empty data sets', () => {
    // Clear all data
    rtm.requirements.clear();
    rtm.userStories.clear();
    rtm.testCases.clear();
    rtm.coverage.requirements.clear();
    rtm.coverage.stories.clear();
    rtm.coverage.types.requirements.clear();
    rtm.coverage.types.tests.clear();

    const summary = reportGenerator.generateSummary();
    expect(summary.totalRequirements).toBe(0);
    expect(summary.totalUserStories).toBe(0);
    expect(summary.totalTestCases).toBe(0);
    expect(summary.coverage.requirements.percentage).toBe(0);
    expect(summary.coverage.userStories.percentage).toBe(0);
  });
});