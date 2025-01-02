# cypress-rtm-plugin

A Requirements Traceability Matrix (RTM) plugin for Cypress to track and report test coverage against requirements and user stories.

## Features

- Link tests to requirements and user stories
- Track test coverage metrics 
- Generate RTM reports (JSON/HTML)
- Support test types and priorities
- Suite-level metadata
- Coverage gap analysis

## Installation

```bash
npm install cypress-rtm-plugin
```

## Setup

1. Configure plugin in `cypress.config.js`:

```javascript
const { CypressRTM, RTMTasks } = require('cypress-rtm-plugin');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      const rtm = new CypressRTM({
        userStoriesPath: 'cypress/fixtures/user-stories.json',
        requirementsPath: 'cypress/fixtures/requirements.json', 
        outputPath: 'cypress/reports/rtm'
      });

      return rtm.init()
        .then(() => {
          const rtmTasks = new RTMTasks(rtm);
          rtmTasks.register(on);
          return config;
        });
    }
  }
});
```

2. Create requirement definitions in `cypress/fixtures/requirements.json`:

```json
{
  "REQ-001": {
    "id": "REQ-001",
    "title": "User Authentication",
    "type": "functional",
    "priority": "p1-high",
    "description": "Users must authenticate before accessing protected resources"
  }
}
```

3. Create user stories in `cypress/fixtures/user-stories.json`:

```json
{
  "US-001": {
    "id": "US-001", 
    "title": "Login Flow",
    "description": "As a user I want to login to access my account",
    "acceptanceCriteria": ["Valid credentials allow access"]
  }
}
```

## Usage

Link tests to requirements:

```javascript
describe('Authentication', () => {
  it('should login successfully', () => {
    cy.requirement('REQ-001');
    // Test implementation
  });
});
```

Link to user stories:

```javascript
it('should reset password', () => {
  cy.userStory('US-001');
  // Test implementation
});
```

Add detailed test metadata:

```javascript
it('should validate security requirements', () => {
  cy.testMetadata({
    type: 'security',
    priority: 'p1-must-run',
    requirements: ['REQ-001'],
    userStories: ['US-001'],
    tags: ['security']
  });
  // Test implementation
});
```

Define suite metadata:

```javascript
describe('Security Tests', () => {
  before(() => {
    cy.suite({
      type: 'security',
      priority: 'p1-must-run',
      requirements: ['REQ-001'],
      tags: ['security']
    });
  });
});
```

## Reports

Reports are generated after test runs in the output directory:

- `rtm-report.json`: Coverage data in JSON format
- `rtm-report.html`: HTML report with coverage metrics and traceability matrix

## Types

TypeScript types are included for all plugin interfaces.

## License

MIT