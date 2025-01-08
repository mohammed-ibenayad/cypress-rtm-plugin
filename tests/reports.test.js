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
  }

  test('should generate summary correctly', () => {
    const summary = reportGenerator.generateSummary();
    
    expect(summary).toEqual({
      totalRequirements: 2,
      totalUserStories: 2,
      totalTestCases: 2,
      execution: {
        passed: 0,
        failed: 0,
        skipped: 0,
        percentagePassed: 0
      }
    });
  });

  test('should get requirements details correctly', () => {
    const details = reportGenerator.getRequirementsDetails();
    
    expect(details).toHaveLength(2);
    expect(details[0]).toMatchObject({
      id: 'REQ-001',
      title: 'Login Functionality',
      type: REQUIREMENT_TYPES.FUNCTIONAL,
      priority: REQUIREMENT_PRIORITIES.P0,
      description: 'Users must be able to login'
    });
  });

  test('should get user stories details correctly', () => {
    const details = reportGenerator.getUserStoriesDetails();
    
    expect(details).toHaveLength(2);
    expect(details[0]).toMatchObject({
      id: 'US-001',
      title: 'User Login',
      description: 'As a user, I want to login',
      linkedRequirements: ['REQ-001']
    });
  });

  test('should get test cases details correctly', () => {
    const details = reportGenerator.getTestCasesDetails();
    
    expect(details).toHaveLength(2);
    expect(details[0]).toMatchObject({
      id: 'TC-001',
      title: 'Successful Login',
      type: TEST_TYPES.E2E,
      priority: TEST_PRIORITIES.P1,
      requirements: ['REQ-001'],
      userStories: ['US-001']
    });
  });

  test('should generate JSON report file', async () => {
    await reportGenerator.generateReports();
    
    const jsonPath = path.join(outputPath, 'data22.json');
    const exists = await fs.access(jsonPath)
      .then(() => true)
      .catch(() => false);
    
    expect(exists).toBe(true);
    
    const content = await fs.readFile(jsonPath, 'utf8');
    const report = JSON.parse(content);
    
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('execution');
    expect(report).toHaveProperty('uncovered');
  });

  test('should handle empty data sets', () => {
    // Clear all data
    rtm.requirements.clear();
    rtm.userStories.clear();
    rtm.testCases.clear();

    const summary = reportGenerator.generateSummary();
    expect(summary.totalRequirements).toBe(0);
    expect(summary.totalUserStories).toBe(0);
    expect(summary.totalTestCases).toBe(0);
    expect(summary.execution.passed).toBe(0);
    expect(summary.execution.failed).toBe(0);
    expect(summary.execution.skipped).toBe(0);
    expect(summary.execution.percentagePassed).toBe(0);
  });
});