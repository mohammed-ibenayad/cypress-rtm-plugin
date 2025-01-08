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
    await this.generateJSONReport(reportData);
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
      execution: {
        testCases: this.getTestCasesDetails()
      },
      uncovered: {
        requirements: this.getUncoveredRequirements(),
        userStories: this.getUncoveredUserStories()
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
      execution: {
        passed: Array.from(this.rtm.testCases.values()).filter(tc => tc.status === 'passed').length,
        failed: Array.from(this.rtm.testCases.values()).filter(tc => tc.status === 'failed').length,
        skipped: Array.from(this.rtm.testCases.values()).filter(tc => tc.status === 'skipped').length,
        percentagePassed: this.calculatePercentage(
          Array.from(this.rtm.testCases.values()).filter(tc => tc.status === 'passed').length,
          this.rtm.testCases.size
        )
      }
    };
  }

  /**
   * Get uncovered requirements
   */
  getUncoveredRequirements() {
    return Array.from(this.rtm.requirements.keys())
      .filter(reqId => !Array.from(this.rtm.testCases.values()).some(tc => tc.requirements?.includes(reqId)));
  }

  /**
   * Get uncovered user stories
   */
  getUncoveredUserStories() {
    return Array.from(this.rtm.userStories.keys())
      .filter(storyId => !Array.from(this.rtm.testCases.values()).some(tc => tc.userStories?.includes(storyId)));
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
   * Get detailed requirements information
   */
  getRequirementsDetails() {
    return Array.from(this.rtm.requirements.values());
  }

  /**
   * Get detailed user stories information
   */
  getUserStoriesDetails() {
    return Array.from(this.rtm.userStories.values());
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport(data) {
    const jsonPath = path.join(this.rtm.config.outputPath, 'data22.json');
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
  }
}

module.exports = RTMReportGenerator;