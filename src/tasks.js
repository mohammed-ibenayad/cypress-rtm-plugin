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
    this.applySuiteToTests = this.applySuiteToTests.bind(this);
    this.getCoverage = this.getCoverage.bind(this);
  }

  /**
   * Validate a requirement ID
   */
  validateRequirement(reqId) {
    try {
      const exists = this.rtm.requirements.has(reqId);
      if (exists && !this.rtm.coverage.requirements.has(reqId)) {
        this.rtm.coverage.requirements.set(reqId, new Set());
      }
      return exists;
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
      const exists = this.rtm.userStories.has(storyId);
      if (exists && !this.rtm.coverage.stories.has(storyId)) {
        this.rtm.coverage.stories.set(storyId, new Set());
      }
      return exists;
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
   * Apply suite metadata to tests
   */
  applySuiteToTests(suiteId) {
    try {
      const suite = this.rtm.suites.get(suiteId);
      if (!suite) {
        throw new RTMError(`Suite ${suiteId} not found`, 'SUITE_NOT_FOUND');
      }

      // Update all tests in the suite
      for (const [testId, test] of this.rtm.testCases.entries()) {
        if (test.suiteId === suiteId) {
          const updatedTest = {
            ...test,
            requirements: [...new Set([...(test.requirements || []), ...(suite.requirements || [])])],
            userStories: [...new Set([...(test.userStories || []), ...(suite.userStories || [])])],
            tags: [...new Set([...(test.tags || []), ...(suite.tags || [])])]
          };
          this.rtm.testCases.set(testId, updatedTest);
        }
      }
      return null;
    } catch (error) {
      if (!(error instanceof RTMError)) {
        console.error('Unexpected error applying suite metadata:', error);
      }
      throw error;
    }
  }

  /**
   * Get coverage statistics
   */
  getCoverage() {
    try {
      return {
        requirements: {
          total: this.rtm.requirements.size,
          covered: this.rtm.coverage.requirements.size,
          percentage: (this.rtm.coverage.requirements.size / this.rtm.requirements.size) * 100
        },
        stories: {
          total: this.rtm.userStories.size,
          covered: this.rtm.coverage.stories.size,
          percentage: (this.rtm.coverage.stories.size / this.rtm.userStories.size) * 100
        }
      };
    } catch (error) {
      if (!(error instanceof RTMError)) {
        console.error('Unexpected error getting coverage:', error);
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
      'rtm:addSuite': this.addSuite,
      'rtm:applySuiteToTests': this.applySuiteToTests,
      'rtm:getCoverage': this.getCoverage
    };

    on('task', tasks);
    on('after:run', () => this.rtm.generateReports());
  }
}

module.exports = RTMTasks;