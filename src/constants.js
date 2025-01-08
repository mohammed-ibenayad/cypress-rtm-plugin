// src/constants.js

/**
 * Requirement types supported by the RTM plugin
 * @readonly
 * @enum {string}
 */
const REQUIREMENT_TYPES = {
  FUNCTIONAL: 'functional',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  ACCESSIBILITY: 'accessibility',
  COMPLIANCE: 'compliance',
  TECHNICAL: 'technical',
  INFRASTRUCTURE: 'infrastructure'
};

/**
 * Test types supported by the RTM plugin
 * @readonly
 * @enum {string}
 */
const TEST_TYPES = {
  UNIT: 'unit',
  INTEGRATION: 'integration',
  E2E: 'e2e',
  API: 'api',
  PERFORMANCE: 'performance',
  SECURITY: 'security',
  ACCESSIBILITY: 'accessibility',
  SMOKE: 'smoke'
};

/**
 * Requirement priority levels
 * @readonly
 * @enum {string}
 */
const REQUIREMENT_PRIORITIES = {
  P0: 'p0-critical',    // Must have - System cannot function without this
  P1: 'p1-high',        // Should have - Critical business feature
  P2: 'p2-medium',      // Nice to have - Important but not critical
  P3: 'p3-low'         // Could have - Desirable but not necessary
};

/**
 * Test priority levels
 * @readonly
 * @enum {string}
 */
const TEST_PRIORITIES = {
  P1: 'p1-must-run',    // Must run in every test cycle
  P2: 'p2-high-value',  // Should run in most test cycles
  P3: 'p3-nice-to-have',// Run when time permits
  P4: 'p4-edge-cases'   // Run in full regression only
};

/**
 * Schema definition for requirements
 * @type {Object}
 */
const REQUIREMENT_SCHEMA = {
  required: ['id', 'title', 'type', 'priority'],
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    type: { enum: Object.values(REQUIREMENT_TYPES) },
    priority: { enum: Object.values(REQUIREMENT_PRIORITIES) },
    userStory: { type: 'string' },
    acceptanceCriteria: {
      type: 'array',
      items: { type: 'string' }
    },
    relatedRequirements: {
      type: 'array',
      items: { type: 'string' }
    },
    tags: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

/**
 * Schema definition for test cases
 * @type {Object}
 */
const TEST_CASE_SCHEMA = {
  required: ['id', 'title', 'type', 'priority'],
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    type: { enum: Object.values(TEST_TYPES) },
    priority: { enum: Object.values(TEST_PRIORITIES) },
    requirements: {
      type: 'array',
      items: { type: 'string' }
    },
    userStories: {
      type: 'array',
      items: { type: 'string' }
    },
    automated: { type: 'boolean' },
    tags: {
      type: 'array',
      items: { type: 'string' }
    },
    dependencies: {
      type: 'array',
      items: { type: 'string' }
    },
    timestamp: { type: 'string' } // Added this line
  }
};

module.exports = {
  REQUIREMENT_TYPES,
  TEST_TYPES,
  REQUIREMENT_PRIORITIES,
  TEST_PRIORITIES,
  REQUIREMENT_SCHEMA,
  TEST_CASE_SCHEMA
};