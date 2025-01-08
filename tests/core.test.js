// tests/core.test.js
const { CypressRTM } = require('../src/core');
const { TEST_TYPES, TEST_PRIORITIES, REQUIREMENT_TYPES, REQUIREMENT_PRIORITIES } = require('../src/constants');
const path = require('path');

describe('CypressRTM Core', () => {
  let rtm;

  beforeEach(() => {
    rtm = new CypressRTM({
      userStoriesPath: path.join(__dirname, 'fixtures/user-stories.json'),
      requirementsPath: path.join(__dirname, 'fixtures/requirements.json'),
      outputPath: path.join(__dirname, 'output')
    });

    // Add a valid requirement for testing
    rtm.requirements.set('REQ-001', {
      id: 'REQ-001',
      title: 'Test Requirement',
      type: REQUIREMENT_TYPES.FUNCTIONAL,
      priority: REQUIREMENT_PRIORITIES.P1,
      description: 'Test description'
    });
  });

  test('should initialize with default config', () => {
    const defaultRtm = new CypressRTM();
    expect(defaultRtm.config.userStoriesPath).toBe('cypress/fixtures/user-stories.json');
    expect(defaultRtm.config.requirementsPath).toBe('cypress/fixtures/requirements.json');
    expect(defaultRtm.config.outputPath).toBe('cypress/reports/rtm');
    expect(defaultRtm.config.validateLinks).toBe(true);
  });

  test('should validate valid requirement', () => {
    const validRequirement = {
      id: 'REQ-002',
      title: 'Test Requirement',
      type: REQUIREMENT_TYPES.FUNCTIONAL,
      priority: REQUIREMENT_PRIORITIES.P1,
      description: 'Test description'
    };
    expect(rtm.validateRequirement(validRequirement)).toBe(true);
  });

  test('should reject invalid requirement', () => {
    const invalidRequirement = {
      id: 'REQ-002',
      title: 'Test Requirement',
      type: 'invalid-type',
      priority: REQUIREMENT_PRIORITIES.P1
    };
    expect(rtm.validateRequirement(invalidRequirement)).toBe(false);
  });

  test('should validate valid test case', () => {
    const validTestCase = {
      id: 'TC-001',
      title: 'Test Case',
      type: TEST_TYPES.E2E,
      priority: TEST_PRIORITIES.P1,
      requirements: ['REQ-001']
    };
    expect(rtm.validateTestCase(validTestCase)).toBe(true);
  });

  test('should reject test case with invalid requirement reference', () => {
    const invalidTestCase = {
      id: 'TC-001',
      title: 'Test Case',
      type: TEST_TYPES.E2E,
      priority: TEST_PRIORITIES.P1,
      requirements: ['REQ-NONEXISTENT']
    };
    expect(rtm.validateTestCase(invalidTestCase)).toBe(false);
  });

  test('should add test case', () => {
    const testCase = {
      id: 'TC-001',
      title: 'Test Case',
      type: TEST_TYPES.E2E,
      priority: TEST_PRIORITIES.P1,
      requirements: ['REQ-001']
    };

    rtm.addTestCase(testCase);
    
    // Verify test case was added
    expect(rtm.testCases.has('TC-001')).toBe(true);
  });

  test('should throw error for invalid test case', () => {
    const invalidTestCase = {
      id: 'TC-001',
      type: TEST_TYPES.E2E,
      // Missing required title
      requirements: ['REQ-001']
    };

    expect(() => rtm.addTestCase(invalidTestCase)).toThrow('Invalid test case structure');
  });

  test('should handle test case with no requirements', () => {
    const testCase = {
      id: 'TC-001',
      title: 'Test Case',
      type: TEST_TYPES.E2E,
      priority: TEST_PRIORITIES.P1
    };

    rtm.addTestCase(testCase);
    expect(rtm.testCases.has('TC-001')).toBe(true);
  });
});