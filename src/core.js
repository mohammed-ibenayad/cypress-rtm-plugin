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
   * Add a test case
   */
  addTestCase(testCase) {
    // Validate test case
    if (!this.validateTestCase(testCase)) {
      throw new RTMError('Invalid test case structure', 'INVALID_TEST_CASE');
    }

    // Store test case
    this.testCases.set(testCase.id, testCase);
  }

  /**
   * Update the coverage.json file with new test cases and metrics
   */
  async updateCoverage() {
    const coveragePath = path.join(this.config.outputPath, 'coverage.json');
    let coverageData = { testCases: [], metrics: {} };

    try {
      // Read existing coverage data if the file exists
      if (await fs.access(coveragePath).then(() => true).catch(() => false)) {
        const content = await fs.readFile(coveragePath, 'utf8');
        coverageData = JSON.parse(content);
      }

      // Append new test cases
      for (const [testId, testCase] of this.testCases.entries()) {
        if (!coverageData.testCases.some(tc => tc.id === testId)) {
          coverageData.testCases.push(testCase);
        }
      }

      // Calculate aggregated metrics
      const totalTestCases = coverageData.testCases.length;
      const passedTestCases = coverageData.testCases.filter(tc => tc.status === 'passed').length;
      const failedTestCases = coverageData.testCases.filter(tc => tc.status === 'failed').length;
      const skippedTestCases = coverageData.testCases.filter(tc => tc.status === 'skipped').length;

      const totalRequirements = this.requirements.size;
      const coveredRequirements = new Set(
        coverageData.testCases.flatMap(tc => tc.requirements || [])
      ).size;

      coverageData.metrics = {
        totalTestCases,
        passedTestCases,
        failedTestCases,
        skippedTestCases,
        totalRequirements,
        coveredRequirements,
        coveragePercentage: totalRequirements ? (coveredRequirements / totalRequirements) * 100 : 0
      };

      // Write updated coverage data to file
      await fs.writeFile(coveragePath, JSON.stringify(coverageData, null, 2));
    } catch (error) {
      throw new RTMError(`Failed to update coverage: ${error.message}`, 'COVERAGE_UPDATE_ERROR');
    }
  }

  /**
   * Generate reports
   */
  async generateReports() {
    try {
      // Generate data22.json (without coverage section)
      const data22Path = path.join(this.config.outputPath, 'data22.json');
      const data22 = {
        timestamp: new Date().toISOString(),
        summary: {
          totalRequirements: this.requirements.size,
          totalUserStories: this.userStories.size,
          totalTestCases: this.testCases.size,
          execution: {
            passed: Array.from(this.testCases.values()).filter(tc => tc.status === 'passed').length,
            failed: Array.from(this.testCases.values()).filter(tc => tc.status === 'failed').length,
            skipped: Array.from(this.testCases.values()).filter(tc => tc.status === 'skipped').length,
            percentagePassed: this.testCases.size ?
              (Array.from(this.testCases.values()).filter(tc => tc.status === 'passed').length / this.testCases.size) * 100 : 0
          }
        },
        execution: {
          testCases: Array.from(this.testCases.values())
        },
        uncovered: {
          requirements: Array.from(this.requirements.keys())
            .filter(reqId => !Array.from(this.testCases.values()).some(tc => tc.requirements?.includes(reqId))),
          userStories: Array.from(this.userStories.keys())
            .filter(storyId => !Array.from(this.testCases.values()).some(tc => tc.userStories?.includes(storyId)))
        }
      };

      await fs.writeFile(data22Path, JSON.stringify(data22, null, 2));

      // Update coverage.json
      await this.updateCoverage();
    } catch (error) {
      throw new RTMError(`Failed to generate reports: ${error.message}`, 'REPORT_GENERATION_ERROR');
    }
  }
}

module.exports = {
  CypressRTM,
  RTMError
};