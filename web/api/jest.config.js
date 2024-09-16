/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  "testEnvironment": "node",
  "verbose": true,
  "moduleFileExtensions": [
    "js",
    "ts",
    "tsx",
    "json",
    "node"
  ],
  "testPathIgnorePatterns": [
    "/node_modules/"
  ],
  "collectCoverage": true,
  "collectCoverageFrom": ["./src/**"],
  "coverageReporters": ['html'],
  "coverageDirectory": './coverage',
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "testMatch": [
    "**/*.test.ts"
  ]
};