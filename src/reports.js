// src/reports.js
const fs = require('fs').promises;
const path = require('path');

class RTMReportGenerator {
  constructor(rtm) {
    this.rtm = rtm;
  }

  /**
   * Generate all reports
   */
  async generateReports() {
    const reportData = this.collectReportData();
    
    await Promise.all([
      this.generateJSONReport(reportData),
      this.generateHTMLReport(reportData)
    ]);
  }

  /**
   * Calculate percentage safely handling division by zero
   */
  calculatePercentage(numerator, denominator) {
    if (denominator === 0) return 0;
    return (numerator / denominator) * 100;
  }

  /**
   * Collect all data needed for reports
   */
  collectReportData() {
    return {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      coverage: {
        byType: {
          requirements: this.calculateRequirementTypeCoverage(),
          tests: this.calculateTestTypeCoverage()
        },
        byPriority: this.calculatePriorityCoverage()
      },
      traceabilityMatrix: this.generateTraceabilityMatrix(),
      details: {
        requirements: this.getRequirementsDetails(),
        userStories: this.getUserStoriesDetails(),
        testCases: this.getTestCasesDetails()
      }
    };
  }

  /**
   * Generate summary statistics
   */
  generateSummary() {
    return {
      totalRequirements: this.rtm.requirements.size,
      totalUserStories: this.rtm.userStories.size,
      totalTestCases: this.rtm.testCases.size,
      coverage: {
        requirements: {
          covered: this.rtm.coverage.requirements.size,
          percentage: this.calculatePercentage(
            this.rtm.coverage.requirements.size,
            this.rtm.requirements.size
          )
        },
        userStories: {
          covered: this.rtm.coverage.stories.size,
          percentage: this.calculatePercentage(
            this.rtm.coverage.stories.size,
            this.rtm.userStories.size
          )
        }
      }
    };
  }

  /**
   * Calculate coverage by requirement type
   */
  calculateRequirementTypeCoverage() {
    const coverage = {};
    this.rtm.coverage.types.requirements.forEach((tests, type) => {
      const totalOfType = Array.from(this.rtm.requirements.values())
        .filter(req => req.type === type).length;
      
      coverage[type] = {
        total: totalOfType,
        covered: tests.size,
        percentage: this.calculatePercentage(tests.size, totalOfType)
      };
    });
    return coverage;
  }

  /**
   * Calculate coverage by test type
   */
  calculateTestTypeCoverage() {
    const coverage = {};
    this.rtm.coverage.types.tests.forEach((tests, type) => {
      coverage[type] = {
        total: tests.size,
        requirements: new Set(
          Array.from(tests).flatMap(testId => 
            this.rtm.testCases.get(testId)?.requirements || []
          )
        ).size
      };
    });
    return coverage;
  }

  /**
   * Calculate coverage by priority
   */
  calculatePriorityCoverage() {
    const requirementCoverage = new Map();
    this.rtm.requirements.forEach((req, reqId) => {
      if (!requirementCoverage.has(req.priority)) {
        requirementCoverage.set(req.priority, { total: 0, covered: 0 });
      }
      const stats = requirementCoverage.get(req.priority);
      stats.total++;
      if (this.rtm.coverage.requirements.has(reqId)) {
        stats.covered++;
      }
    });

    return Object.fromEntries(
      Array.from(requirementCoverage.entries()).map(([priority, stats]) => [
        priority,
        {
          ...stats,
          percentage: this.calculatePercentage(stats.covered, stats.total)
        }
      ])
    );
  }

  /**
   * Generate traceability matrix
   */
  generateTraceabilityMatrix() {
    const matrix = {
      requirementsToTests: {},
      storiesToRequirements: {},
      storiesToTests: {}
    };

    // Map requirements to tests
    this.rtm.coverage.requirements.forEach((tests, reqId) => {
      matrix.requirementsToTests[reqId] = Array.from(tests);
    });

    // Map stories to requirements and tests
    this.rtm.userStories.forEach((story, storyId) => {
      matrix.storiesToRequirements[storyId] = story.linkedRequirements || [];
      matrix.storiesToTests[storyId] = Array.from(
        this.rtm.coverage.stories.get(storyId) || new Set()
      );
    });

    return matrix;
  }

  /**
   * Get detailed requirements information
   */
  getRequirementsDetails() {
    return Array.from(this.rtm.requirements.entries()).map(([reqId, req]) => ({
      ...req,
      coverage: {
        testCases: Array.from(this.rtm.coverage.requirements.get(reqId) || new Set()),
        isCovered: this.rtm.coverage.requirements.has(reqId)
      }
    }));
  }

  /**
   * Get detailed user stories information
   */
  getUserStoriesDetails() {
    return Array.from(this.rtm.userStories.entries()).map(([storyId, story]) => ({
      ...story,
      coverage: {
        testCases: Array.from(this.rtm.coverage.stories.get(storyId) || new Set()),
        requirements: story.linkedRequirements || [],
        isCovered: this.rtm.coverage.stories.has(storyId)
      }
    }));
  }

  /**
   * Get detailed test cases information
   */
  getTestCasesDetails() {
    return Array.from(this.rtm.testCases.entries()).map(([testId, test]) => ({
      ...test,
      coverage: {
        requirements: test.requirements || [],
        userStories: test.userStories || []
      }
    }));
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport(data) {
    const jsonPath = path.join(this.rtm.config.outputPath, 'rtm-report.json');
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(data) {
    const htmlPath = path.join(this.rtm.config.outputPath, 'rtm-report.html');
    const html = this.generateHTMLContent(data);
    await fs.writeFile(htmlPath, html);
  }

  /**
   * Generate HTML content for report
   */
  generateHTMLContent(data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>RTM Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .summary { margin: 20px 0; }
            .coverage { margin: 20px 0; }
            .matrix { margin: 20px 0; }
            .details { margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Requirements Traceability Matrix Report</h1>
          <div class="summary">
            <h2>Summary</h2>
            <pre>${JSON.stringify(data.summary, null, 2)}</pre>
          </div>
          <div class="coverage">
            <h2>Coverage Analysis</h2>
            <pre>${JSON.stringify(data.coverage, null, 2)}</pre>
          </div>
          <div class="matrix">
            <h2>Traceability Matrix</h2>
            <pre>${JSON.stringify(data.traceabilityMatrix, null, 2)}</pre>
          </div>
          <div class="details">
            <h2>Detailed Information</h2>
            <pre>${JSON.stringify(data.details, null, 2)}</pre>
          </div>
        </body>
      </html>
    `;
  }
}

module.exports = RTMReportGenerator;