export default {
  // Test environment
  testEnvironment: 'node',

  // File extensions to test
  moduleFileExtensions: ['js', 'json'],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Transform ES modules (since we use import/export)
  transform: {},

  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],

  // Coverage threshold (start low, increase over time)
  coverageThreshold: {
    global: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0
    }
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],

  // Module name mapper for Phaser (mock it in tests)
  moduleNameMapper: {
    '^phaser$': '<rootDir>/__mocks__/phaser.js'
  },

  // Verbose output
  verbose: true
};
