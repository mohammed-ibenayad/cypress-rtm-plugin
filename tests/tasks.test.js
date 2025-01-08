// tests/tasks.test.js
const RTMTasks = require('../src/tasks');
const { CypressRTM } = require('../src/core');
const { TEST_TYPES, TEST_PRIORITIES } = require('../src/constants');

describe('RTMTasks', () => {
  let rtm;
  let tasks;
  let cypressOn;
  let registeredTasks;

  beforeEach(() => {
    // Create RTM instance with mock data
    rtm = new CypressRTM();
    
    // Initialize data stores with test data
    rtm.requirements = new Map([
      ['REQ-001', { 
        id: 'REQ-001', 
        title: 'Test Requirement',
        type: 'functional',
        priority: 'p1-high'
      }]
    ]);
    
    rtm.userStories = new Map([
      ['US-001', { 
        id: 'US-001',
        title: 'Test Story'
      }]
    ]);

    rtm.generateReports = jest.fn().mockResolvedValue(null);
    
    // Create tasks instance
    tasks = new RTMTasks(rtm);

    // Mock Cypress 'on' function
    registeredTasks = {};
    cypressOn = jest.fn((event, tasksObj) => {
      if (event === 'task') {
        registeredTasks = tasksObj;
      }
    });
  });

  test('should require CypressRTM instance', () => {
    expect(() => new RTMTasks({})).toThrow('RTMTasks requires a CypressRTM instance');
  });

  test('should register all tasks with Cypress', () => {
    tasks.register(cypressOn);
    
    // Verify task registration calls
    expect(cypressOn).toHaveBeenCalledWith('task', expect.any(Object));
    expect(cypressOn).toHaveBeenCalledWith('after:run', expect.any(Function));
    
    // Verify each task is registered
    expect(registeredTasks).toHaveProperty('rtm:validateRequirement');
    expect(registeredTasks).toHaveProperty('rtm:validateStory');
    expect(registeredTasks).toHaveProperty('rtm:addTestCase');
    expect(registeredTasks).toHaveProperty('rtm:addSuite');
  });

  test('should validate requirement correctly', () => {
    // Test valid requirement
    expect(tasks.validateRequirement('REQ-001')).toBe(true);
    
    // Test invalid requirement
    expect(tasks.validateRequirement('REQ-002')).toBe(false);
  });

  test('should validate user story correctly', () => {
    // Test valid story
    expect(tasks.validateStory('US-001')).toBe(true);
    
    // Test invalid story
    expect(tasks.validateStory('US-002')).toBe(false);
  });

  test('should add test case', () => {
    const testCase = {
      id: 'TC-001',
      title: 'Test Case',
      type: TEST_TYPES.E2E,
      priority: TEST_PRIORITIES.P1,
      requirements: ['REQ-001'],
      userStories: ['US-001']
    };

    tasks.addTestCase(testCase);
    
    // Verify test case was added
    expect(rtm.testCases.has(testCase.id)).toBe(true);
  });

  test('should add suite metadata', () => {
    const suite = {
      id: 'TS-001',
      title: 'Test Suite',
      type: TEST_TYPES.E2E,
      priority: TEST_PRIORITIES.P1,
      requirements: ['REQ-001'],
      userStories: ['US-001']
    };

    tasks.addSuite(suite);
    
    // Verify suite was added
    expect(rtm.suites.has(suite.id)).toBe(true);
    const savedSuite = rtm.suites.get(suite.id);
    expect(savedSuite).toMatchObject(suite);
    expect(savedSuite.timestamp).toBeDefined();
  });

  test('should handle errors in test case validation', () => {
    const invalidTestCase = {
      id: 'TC-001',
      // Missing required title
      type: 'invalid-type', // Invalid type
      requirements: ['REQ-999'] // Non-existent requirement
    };

    expect(() => tasks.addTestCase(invalidTestCase)).toThrow();
  });
});