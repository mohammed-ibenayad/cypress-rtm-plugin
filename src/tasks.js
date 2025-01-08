// src/tasks.js
const { CypressRTM, RTMError } = require('./core');
const { TEST_TYPES, TEST_PRIORITIES } = require('./constants');

class RTMTasks {
  constructor(rtm) {
    if (!(rtm instanceof CypressRTM)) {
      throw new Error('RTMTasks requires a CypressRTM instance');
    }
    this.rtm = rtm;

    // Bind all methods
    this.validateRequirement = this.validateRequirement.bind(this);
    this.validateStory = this.validateStory.bind(this);
    this.addTestCase = this.addTestCase.bind(this);
    this.addSuite = this.addSuite.bind(this);
  }

  /**
   * Validate a requirement ID
   */
  validateRequirement(reqId) {
    try {
      return this.rtm.requirements.has(reqId);
    } catch (error) {
      // Only log unexpected errors
      if (!(error instanceof RTMError)) {
        console.error(`Unexpected error validating requirement ${reqId}:`, error);
      }
      return false;
    }
  }

  /**
   * Validate a user story ID
   */
  validateStory(storyId) {
    try {
      return this.rtm.userStories.has(storyId);
    } catch (error) {
      if (!(error instanceof RTMError)) {
        console.error(`Unexpected error validating story ${storyId}:`, error);
      }
      return false;
    }
  }

  /**
   * Add a test case
   */
  addTestCase(testCase) {
    try {
      const enhancedTestCase = {
        ...testCase,
        type: testCase.type || TEST_TYPES.E2E,
        priority: testCase.priority || TEST_PRIORITIES.P1,
        automated: true
      };
      this.rtm.addTestCase(enhancedTestCase);
      return null;
    } catch (error) {
      // Only log unexpected errors
      if (!(error instanceof RTMError)) {
        console.error('Unexpected error adding test case:', error);
      }
      throw error;
    }
  }

  /**
   * Add suite metadata
   */
  addSuite(suite) {
    try {
      this.rtm.suites.set(suite.id, {
        ...suite,
        timestamp: new Date().toISOString()
      });
      return null;
    } catch (error) {
      if (!(error instanceof RTMError)) {
        console.error('Error adding suite:', error);
      }
      throw error;
    }
  }

  /**
   * Register all RTM-related tasks with Cypress
   */
  register(on) {
    const tasks = {
      'rtm:validateRequirement': this.validateRequirement,
      'rtm:validateStory': this.validateStory,
      'rtm:addTestCase': this.addTestCase,
      'rtm:addSuite': this.addSuite
    };

    on('task', tasks);
    on('after:run', () => this.rtm.generateReports());
  }
}

module.exports = RTMTasks;