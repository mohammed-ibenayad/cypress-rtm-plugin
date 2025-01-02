// tests/commands.test.js
const addCommands = require('../src/commands');
const { TEST_TYPES, TEST_PRIORITIES } = require('../src/constants');

describe('RTM Commands', () => {
  let rtm;
  let tasks;

  beforeEach(() => {
    // Mock Cypress global object
    global.Cypress = {
      Commands: {
        add: jest.fn()
      },
      currentTest: {
        title: 'Test Case Title',
        suite: {
          title: 'Test Suite Title'
        }
      }
    };

    // Mock RTM instance
    rtm = {
      validateRequirement: jest.fn(),
      validateStory: jest.fn(),
      addTestCase: jest.fn(),
      addSuite: jest.fn(),
      applySuiteToTests: jest.fn()
    };

    // Mock Cypress tasks
    tasks = {};
    global.cy = {
      task: jest.fn((name, data) => {
        return Promise.resolve(tasks[name]?.(data));
      })
    };
  });

  test('should register all commands', () => {
    addCommands(rtm);
    
    expect(Cypress.Commands.add).toHaveBeenCalledWith('requirement', expect.any(Function));
    expect(Cypress.Commands.add).toHaveBeenCalledWith('userStory', expect.any(Function));
    expect(Cypress.Commands.add).toHaveBeenCalledWith('testMetadata', expect.any(Function));
    expect(Cypress.Commands.add).toHaveBeenCalledWith('suite', expect.any(Function));
  });

  test('requirement command should validate and add test case', async () => {
    addCommands(rtm);
    
    // Mock successful requirement validation
    tasks['rtm:validateRequirement'] = () => true;
    tasks['rtm:addTestCase'] = jest.fn();

    // Get the requirement command function
    const reqCommand = Cypress.Commands.add.mock.calls.find(
      call => call[0] === 'requirement'
    )[1];

    // Execute command
    await reqCommand('REQ-001');

    // Verify validation was called
    expect(cy.task).toHaveBeenCalledWith('rtm:validateRequirement', 'REQ-001');

    // Verify test case was added with correct data
    expect(cy.task).toHaveBeenCalledWith('rtm:addTestCase', expect.objectContaining({
      id: 'TC-Test Case Title',
      title: 'Test Case Title',
      type: TEST_TYPES.E2E,
      priority: TEST_PRIORITIES.P1,
      requirements: ['REQ-001'],
      automated: true
    }));
  });

  test('userStory command should validate and add test case', async () => {
    addCommands(rtm);
    
    // Mock successful story validation
    tasks['rtm:validateStory'] = () => true;
    tasks['rtm:addTestCase'] = jest.fn();

    // Get the userStory command function
    const storyCommand = Cypress.Commands.add.mock.calls.find(
      call => call[0] === 'userStory'
    )[1];

    // Execute command
    await storyCommand('US-001');

    // Verify validation was called
    expect(cy.task).toHaveBeenCalledWith('rtm:validateStory', 'US-001');

    // Verify test case was added with correct data
    expect(cy.task).toHaveBeenCalledWith('rtm:addTestCase', expect.objectContaining({
      id: 'TC-Test Case Title',
      title: 'Test Case Title',
      type: TEST_TYPES.E2E,
      priority: TEST_PRIORITIES.P1,
      userStories: ['US-001'],
      automated: true
    }));
  });

  test('testMetadata command should handle comprehensive test data', async () => {
    addCommands(rtm);
    
    // Mock successful validations
    tasks['rtm:validateRequirement'] = () => true;
    tasks['rtm:validateStory'] = () => true;
    tasks['rtm:addTestCase'] = jest.fn();

    // Get the testMetadata command function
    const metadataCommand = Cypress.Commands.add.mock.calls.find(
      call => call[0] === 'testMetadata'
    )[1];

    const metadata = {
      type: TEST_TYPES.INTEGRATION,
      priority: TEST_PRIORITIES.P2,
      requirements: ['REQ-001'],
      userStories: ['US-001'],
      tags: ['regression'],
      description: 'Test description',
      dependencies: ['TC-001']
    };

    // Execute command
    await metadataCommand(metadata);

    // Verify test case was added with all metadata
    expect(cy.task).toHaveBeenCalledWith('rtm:addTestCase', expect.objectContaining({
      ...metadata,
      id: 'TC-Test Case Title',
      title: 'Test Case Title',
      automated: true
    }));
  });
});