// src/commands.js
const { TEST_TYPES, TEST_PRIORITIES } = require('./constants');

/**
 * Add custom RTM commands to Cypress
 * @param {CypressRTM} rtm - Instance of the RTM plugin
 */
function addCommands(rtm) {
  Cypress.Commands.add('requirement', (reqId, options = {}) => {
    // Validate requirement exists
    cy.task('rtm:validateRequirement', reqId).then((isValid) => {
      if (!isValid) {
        throw new Error(`Invalid requirement ID: ${reqId}`);
      }

      // Get current test info
      const testCase = {
        id: `TC-${Cypress.currentTest.title}`,
        title: Cypress.currentTest.title,
        type: options.type || TEST_TYPES.E2E,
        priority: options.priority || TEST_PRIORITIES.P1,
        requirements: [reqId],
        automated: true,
        timestamp: new Date().toISOString()
      };

      // Register test case
      cy.task('rtm:addTestCase', testCase);
    });
  });

  Cypress.Commands.add('userStory', (storyId, options = {}) => {
    // Validate user story exists
    cy.task('rtm:validateStory', storyId).then((isValid) => {
      if (!isValid) {
        throw new Error(`Invalid user story ID: ${storyId}`);
      }

      // Get current test info
      const testCase = {
        id: `TC-${Cypress.currentTest.title}`,
        title: Cypress.currentTest.title,
        type: options.type || TEST_TYPES.E2E,
        priority: options.priority || TEST_PRIORITIES.P1,
        userStories: [storyId],
        automated: true,
        timestamp: new Date().toISOString()
      };

      // Register test case
      cy.task('rtm:addTestCase', testCase);
    });
  });

  Cypress.Commands.add('testMetadata', (metadata = {}) => {
    const testCase = {
      id: `TC-${Cypress.currentTest.title}`,
      title: Cypress.currentTest.title,
      type: metadata.type || TEST_TYPES.E2E,
      priority: metadata.priority || TEST_PRIORITIES.P1,
      requirements: metadata.requirements || [],
      userStories: metadata.userStories || [],
      automated: true,
      tags: metadata.tags || [],
      dependencies: metadata.dependencies || [],
      description: metadata.description,
      timestamp: new Date().toISOString()
    };

    // Validate requirements if provided
    if (testCase.requirements.length > 0) {
      testCase.requirements.forEach(reqId => {
        cy.task('rtm:validateRequirement', reqId).then((isValid) => {
          if (!isValid) {
            throw new Error(`Invalid requirement ID: ${reqId}`);
          }
        });
      });
    }

    // Validate user stories if provided
    if (testCase.userStories.length > 0) {
      testCase.userStories.forEach(storyId => {
        cy.task('rtm:validateStory', storyId).then((isValid) => {
          if (!isValid) {
            throw new Error(`Invalid user story ID: ${storyId}`);
          }
        });
      });
    }

    // Register test case
    cy.task('rtm:addTestCase', testCase);
  });

  // Add command for test suites
  Cypress.Commands.add('suite', (metadata = {}) => {
    const suiteId = Cypress.currentTest.suite.title;

    // Store suite metadata
    cy.task('rtm:addSuite', {
      id: `TS-${suiteId}`,
      title: suiteId,
      type: metadata.type,
      priority: metadata.priority,
      requirements: metadata.requirements || [],
      userStories: metadata.userStories || [],
      tags: metadata.tags || [],
      description: metadata.description
    });
  });
}

module.exports = addCommands;