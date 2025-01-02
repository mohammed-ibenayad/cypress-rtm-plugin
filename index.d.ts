declare module 'cypress-rtm-plugin' {
    export interface RTMConfig {
      userStoriesPath?: string;
      requirementsPath?: string;
      outputPath?: string;
      validateLinks?: boolean;
    }
  
    export interface TestCase {
      id: string;
      title: string;
      type: string;
      priority: string;
      requirements?: string[];
      userStories?: string[];
      automated?: boolean;
      tags?: string[];
      dependencies?: string[];
      description?: string;
      timestamp?: string;
    }
  
    export class CypressRTM {
      constructor(config?: RTMConfig);
      init(): Promise<boolean>;
      generateReports(): Promise<void>;
    }
  
    export class RTMTasks {
      constructor(rtm: CypressRTM);
      register(on: Cypress.PluginEvents): void;
    }
  
    export function addCommands(rtm: CypressRTM): void;
  }
  
  declare global {
    namespace Cypress {
      interface Chainable {
        requirement(reqId: string, options?: any): Chainable<void>;
        userStory(storyId: string, options?: any): Chainable<void>;
        testMetadata(metadata: any): Chainable<void>;
        suite(metadata: any): Chainable<void>;
      }
    }
  }