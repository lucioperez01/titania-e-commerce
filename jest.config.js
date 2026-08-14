/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Jest config legitimately uses require() */
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
    "^@/(.*)$": "<rootDir>/$1",
    "^next-auth/react$": "<rootDir>/__mocks__/next-auth-react.ts"
  },
  transformIgnorePatterns: ["node_modules/(?!(next-auth)/)"],
  modulePaths: ["<rootDir>"],
  rootDir: ".",
};