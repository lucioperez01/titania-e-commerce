const { createDefaultPreset } = require("ts-jest");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  },
  transformIgnorePatterns: ["node_modules/"],
  modulePaths: ["<rootDir>"],
  rootDir: ".",
};