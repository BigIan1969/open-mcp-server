module.exports = {
  testEnvironment: "node",
  verbose: true,
  testMatch: ["**/tests/**/*.test.js"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/e2e/"
  ]
};