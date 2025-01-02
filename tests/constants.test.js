// tests/constants.test.js
const {
    REQUIREMENT_TYPES,
    TEST_TYPES,
    REQUIREMENT_PRIORITIES,
    TEST_PRIORITIES,
    REQUIREMENT_SCHEMA,
    TEST_CASE_SCHEMA
  } = require('../src/constants');
  
  describe('RTM Constants', () => {
    describe('REQUIREMENT_TYPES', () => {
      test('should have all expected requirement types', () => {
        const expectedTypes = [
          'functional',
          'security',
          'performance',
          'accessibility',
          'compliance',
          'technical',
          'infrastructure'
        ];
        
        expect(Object.values(REQUIREMENT_TYPES)).toEqual(expect.arrayContaining(expectedTypes));
        expect(Object.values(REQUIREMENT_TYPES).length).toBe(expectedTypes.length);
      });
  
      test('should have unique values', () => {
        const values = Object.values(REQUIREMENT_TYPES);
        const uniqueValues = new Set(values);
        expect(values.length).toBe(uniqueValues.size);
      });
    });
  
    describe('TEST_TYPES', () => {
      test('should have all expected test types', () => {
        const expectedTypes = [
          'unit',
          'integration',
          'e2e',
          'api',
          'performance',
          'security',
          'accessibility',
          'smoke'
        ];
        
        expect(Object.values(TEST_TYPES)).toEqual(expect.arrayContaining(expectedTypes));
        expect(Object.values(TEST_TYPES).length).toBe(expectedTypes.length);
      });
  
      test('should have unique values', () => {
        const values = Object.values(TEST_TYPES);
        const uniqueValues = new Set(values);
        expect(values.length).toBe(uniqueValues.size);
      });
    });
  
    describe('REQUIREMENT_PRIORITIES', () => {
      test('should have all expected priority levels', () => {
        const expectedPriorities = [
          'p0-critical',
          'p1-high',
          'p2-medium',
          'p3-low'
        ];
        
        expect(Object.values(REQUIREMENT_PRIORITIES)).toEqual(expect.arrayContaining(expectedPriorities));
        expect(Object.values(REQUIREMENT_PRIORITIES).length).toBe(expectedPriorities.length);
      });
  
      test('should have unique values', () => {
        const values = Object.values(REQUIREMENT_PRIORITIES);
        const uniqueValues = new Set(values);
        expect(values.length).toBe(uniqueValues.size);
      });
    });
  
    describe('TEST_PRIORITIES', () => {
      test('should have all expected priority levels', () => {
        const expectedPriorities = [
          'p1-must-run',
          'p2-high-value',
          'p3-nice-to-have',
          'p4-edge-cases'
        ];
        
        expect(Object.values(TEST_PRIORITIES)).toEqual(expect.arrayContaining(expectedPriorities));
        expect(Object.values(TEST_PRIORITIES).length).toBe(expectedPriorities.length);
      });
  
      test('should have unique values', () => {
        const values = Object.values(TEST_PRIORITIES);
        const uniqueValues = new Set(values);
        expect(values.length).toBe(uniqueValues.size);
      });
    });
  
    describe('REQUIREMENT_SCHEMA', () => {
      test('should have required fields defined', () => {
        expect(REQUIREMENT_SCHEMA.required).toContain('id');
        expect(REQUIREMENT_SCHEMA.required).toContain('title');
        expect(REQUIREMENT_SCHEMA.required).toContain('type');
        expect(REQUIREMENT_SCHEMA.required).toContain('priority');
      });
  
      test('should have correct property types', () => {
        expect(REQUIREMENT_SCHEMA.properties.id.type).toBe('string');
        expect(REQUIREMENT_SCHEMA.properties.title.type).toBe('string');
        expect(REQUIREMENT_SCHEMA.properties.description.type).toBe('string');
        expect(REQUIREMENT_SCHEMA.properties.type.enum).toEqual(Object.values(REQUIREMENT_TYPES));
        expect(REQUIREMENT_SCHEMA.properties.priority.enum).toEqual(Object.values(REQUIREMENT_PRIORITIES));
      });
  
      test('should have array type for collections', () => {
        expect(REQUIREMENT_SCHEMA.properties.acceptanceCriteria.type).toBe('array');
        expect(REQUIREMENT_SCHEMA.properties.relatedRequirements.type).toBe('array');
        expect(REQUIREMENT_SCHEMA.properties.tags.type).toBe('array');
      });
    });
  
    describe('TEST_CASE_SCHEMA', () => {
      test('should have required fields defined', () => {
        expect(TEST_CASE_SCHEMA.required).toContain('id');
        expect(TEST_CASE_SCHEMA.required).toContain('title');
        expect(TEST_CASE_SCHEMA.required).toContain('type');
        expect(TEST_CASE_SCHEMA.required).toContain('priority');
      });
  
      test('should have correct property types', () => {
        expect(TEST_CASE_SCHEMA.properties.id.type).toBe('string');
        expect(TEST_CASE_SCHEMA.properties.title.type).toBe('string');
        expect(TEST_CASE_SCHEMA.properties.description.type).toBe('string');
        expect(TEST_CASE_SCHEMA.properties.type.enum).toEqual(Object.values(TEST_TYPES));
        expect(TEST_CASE_SCHEMA.properties.priority.enum).toEqual(Object.values(TEST_PRIORITIES));
      });
  
      test('should have array type for collections', () => {
        expect(TEST_CASE_SCHEMA.properties.requirements.type).toBe('array');
        expect(TEST_CASE_SCHEMA.properties.userStories.type).toBe('array');
        expect(TEST_CASE_SCHEMA.properties.tags.type).toBe('array');
        expect(TEST_CASE_SCHEMA.properties.dependencies.type).toBe('array');
      });
    });
  });