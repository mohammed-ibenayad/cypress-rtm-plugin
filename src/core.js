// src/core.js
const fs = require('fs').promises;
const path = require('path');
const RTMReportGenerator = require('./reports');
const {
  REQUIREMENT_TYPES,
  TEST_TYPES,
  REQUIREMENT_PRIORITIES,
  TEST_PRIORITIES,
  REQUIREMENT_SCHEMA,
  TEST_CASE_SCHEMA
} = require('./constants');

class RTMError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'RTMError';
    this.code = code;
  }
}

class CypressRTM {
  constructor(config = {}) {
    this.config = {
      userStoriesPath: config.userStoriesPath || 'cypress/fixtures/user-stories.json',
      requirementsPath: config.requirementsPath || 'cypress/fixtures/requirements.json',
      outputPath: config.outputPath || 'cypress/reports/rtm',
      validateLinks: config.validateLinks ?? true,
      ...config
    };

    // Initialize data stores
    this.userStories = new Map();
    this.requirements = new Map();
    this.testCases = new Map();
    this.suites = new Map();
    
    // Initialize coverage tracking
    this.coverage = {
      requirements: new Map(),
      stories: new Map(),
      types: {
        requirements: new Map(),
        tests: new Map()
      }
    };

    // Initialize report generator
    this.reportGenerator = new RTMReportGenerator(this);
  }

  /**
   * Initialize the plugin
   */
  async init() {
    try {
      // Create output directory if it doesn't exist
      await fs.mkdir(this.config.outputPath, { recursive: true });

      // Load requirements and user stories
      await this.loadRequirements();
      await this.loadUserStories();

      // Initialize coverage maps for loaded data
      this.initializeCoverageMaps();

      return true;
    } catch (error) {
      throw new RTMError(`Failed to initialize RTM: ${error.message}`, 'INIT_ERROR');
    }
  }

  /**
   * Load requirements from file
   */
  async loadRequirements() {
    try {
      const content = await fs.readFile(this.config.requirementsPath, 'utf8');
      const requirements = JSON.parse(content);
      
      Object.entries(requirements).forEach(([id, req]) => {
        if (this.validateRequirement(req)) {
          this.requirements.set(id, req);
        } else {
          throw new RTMError(`Invalid requirement structure for ${id}`, 'INVALID_REQUIREMENT');
        }
      });
    } catch (error) {
      if (error instanceof RTMError) throw error;
      throw new RTMError(`Failed to load requirements: ${error.message}`, 'REQUIREMENTS_LOAD_ERROR');
    }
  }

  /**
   * Load user stories from file
   */
  async loadUserStories() {
    try {
      const content = await fs.readFile(this.config.userStoriesPath, 'utf8');
      const stories = JSON.parse(content);
      
      Object.entries(stories).forEach(([id, story]) => {
        if (story.id && story.title) {
          this.userStories.set(id, story);
        } else {
          throw new RTMError(`Invalid user story structure for ${id}`, 'INVALID_USER_STORY');
        }
      });
    } catch (error) {
      if (error instanceof RTMError) throw error;
      throw new RTMError(`Failed to load user stories: ${error.message}`, 'USER_STORIES_LOAD_ERROR');
    }
  }

  /**
   * Initialize coverage maps for all loaded data
   */
  initializeCoverageMaps() {
    // Initialize requirement type coverage
    this.requirements.forEach(req => {
      if (!this.coverage.types.requirements.has(req.type)) {
        this.coverage.types.requirements.set(req.type, new Set());
      }
    });

    // Initialize story coverage
    this.userStories.forEach((_, storyId) => {
      if (!this.coverage.stories.has(storyId)) {
        this.coverage.stories.set(storyId, new Set());
      }
    });
  }

  /**
   * Validate a requirement against the schema
   */
  validateRequirement(requirement) {
    try {
      // Check if requirement has all required fields
      if (!requirement.id || !requirement.title || !requirement.type || !requirement.priority) {
        return false;
      }

      // Validate requirement type
      if (!Object.values(REQUIREMENT_TYPES).includes(requirement.type)) {
        return false;
      }

      // Validate requirement priority
      if (!Object.values(REQUIREMENT_PRIORITIES).includes(requirement.priority)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate a test case against the schema
   */
  validateTestCase(testCase) {
    try {
      // Check if test case has all required fields
      if (!testCase.id || !testCase.title || !testCase.type || !testCase.priority) {
        return false;
      }

      // Validate test type
      if (!Object.values(TEST_TYPES).includes(testCase.type)) {
        return false;
      }

      // Validate test priority
      if (!Object.values(TEST_PRIORITIES).includes(testCase.priority)) {
        return false;
      }

      // Validate requirements if present
      if (testCase.requirements) {
        if (!Array.isArray(testCase.requirements)) {
          return false;
        }
        // Check if all referenced requirements exist
        const validRequirements = testCase.requirements.every(reqId => 
          this.requirements.has(reqId)
        );
        if (!validRequirements) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Add a test case and update coverage
   */
  addTestCase(testCase) {
    // Validate test case
    if (!this.validateTestCase(testCase)) {
      throw new RTMError('Invalid test case structure', 'INVALID_TEST_CASE');
    }

    // Store test case
    this.testCases.set(testCase.id, testCase);

    // Update requirements coverage
    if (testCase.requirements) {
      testCase.requirements.forEach(reqId => {
        if (!this.coverage.requirements.has(reqId)) {
          this.coverage.requirements.set(reqId, new Set());
        }
        this.coverage.requirements.get(reqId).add(testCase.id);

        // Update requirement type coverage
        const req = this.requirements.get(reqId);
        if (req && req.type) {
          if (!this.coverage.types.requirements.has(req.type)) {
            this.coverage.types.requirements.set(req.type, new Set());
          }
          this.coverage.types.requirements.get(req.type).add(testCase.id);
        }
      });
    }

    // Update user stories coverage
    if (testCase.userStories) {
      testCase.userStories.forEach(storyId => {
        if (!this.coverage.stories.has(storyId)) {
          this.coverage.stories.set(storyId, new Set());
        }
        this.coverage.stories.get(storyId).add(testCase.id);
      });
    }

    // Update test type coverage
    if (!this.coverage.types.tests.has(testCase.type)) {
      this.coverage.types.tests.set(testCase.type, new Set());
    }
    this.coverage.types.tests.get(testCase.type).add(testCase.id);
  }

  /**
   * Generate reports using the report generator
   */
  async generateReports() {
    try {
      await this.reportGenerator.generateReports();
    } catch (error) {
      throw new RTMError(`Failed to generate reports: ${error.message}`, 'REPORT_GENERATION_ERROR');
    }
  }

  /**
   * Get current coverage statistics
   */
  getCoverageStats() {
    return {
      requirements: {
        total: this.requirements.size,
        covered: this.coverage.requirements.size,
        percentage: this.requirements.size ? 
          (this.coverage.requirements.size / this.requirements.size) * 100 : 0
      },
      stories: {
        total: this.userStories.size,
        covered: this.coverage.stories.size,
        percentage: this.userStories.size ? 
          (this.coverage.stories.size / this.userStories.size) * 100 : 0
      },
      byType: {
        requirements: this.getRequirementTypeCoverage(),
        tests: this.getTestTypeCoverage()
      }
    };
  }

  /**
   * Get coverage by requirement type
   */
  getRequirementTypeCoverage() {
    const coverage = {};
    this.coverage.types.requirements.forEach((tests, type) => {
      const totalOfType = Array.from(this.requirements.values())
        .filter(req => req.type === type).length;
      
      coverage[type] = {
        total: totalOfType,
        covered: tests.size,
        percentage: totalOfType ? (tests.size / totalOfType) * 100 : 0
      };
    });
    return coverage;
  }

  /**
   * Get coverage by test type
   */
  getTestTypeCoverage() {
    const coverage = {};
    this.coverage.types.tests.forEach((tests, type) => {
      coverage[type] = {
        total: tests.size,
        requirements: new Set(
          Array.from(tests).flatMap(testId => 
            this.testCases.get(testId)?.requirements || []
          )
        ).size
      };
    });
    return coverage;
  }

  /**
   * Get uncovered items
   */
  getUncoveredItems() {
    return {
      requirements: Array.from(this.requirements.keys())
        .filter(reqId => !this.coverage.requirements.has(reqId)),
      stories: Array.from(this.userStories.keys())
        .filter(storyId => !this.coverage.stories.has(storyId))
    };
  }

  /**
   * Get critical coverage gaps
   */
  getCriticalGaps() {
    const gaps = [];

    // Check high-priority requirements with no tests
    this.requirements.forEach((req, reqId) => {
      if (req.priority === REQUIREMENT_PRIORITIES.P0 && 
          !this.coverage.requirements.has(reqId)) {
        gaps.push({
          type: 'uncovered_critical_requirement',
          requirementId: reqId,
          title: req.title
        });
      }
    });

    // Check security requirements with no security tests
    this.requirements.forEach((req, reqId) => {
      if (req.type === REQUIREMENT_TYPES.SECURITY) {
        const tests = this.coverage.requirements.get(reqId) || new Set();
        const hasSecurityTest = Array.from(tests)
          .some(testId => this.testCases.get(testId)?.type === TEST_TYPES.SECURITY);
        
        if (!hasSecurityTest) {
          gaps.push({
            type: 'security_requirement_no_security_test',
            requirementId: reqId,
            title: req.title
          });
        }
      }
    });

    return gaps;
  }
}

module.exports = {
  CypressRTM,
  RTMError
};