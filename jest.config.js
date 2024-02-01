/** @type {import("ts-jest").JestConfigWithTsJest} */
module.exports = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  silent: false,
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/src/migrations'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/src/migrations'],
  collectCoverage: true,
  coverageReporters: ['text', 'cobertura', 'html'],
  detectOpenHandles: true,
  detectLeaks: false,
};
