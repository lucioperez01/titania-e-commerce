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
  // Coverage collection: measure all source files, not just those imported by tests
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/*.test.{ts,tsx}",
    "!**/__mocks__/**",
    "!**/*.d.ts",
    "!coverage/**",
    "!.next/**",
    // Config files (edge/runtime env, minimal code)
    "!next.config.ts",
    "!auth.config.ts",
    // Dev-only mock (never imported by src or tests)
    "!infrastructure/repositories/product-repository-mock.ts",
  ],
  // Tiered thresholds: PATH keys (e.g. './domain/') aggregate across files,
  // NOT per-file (that would be './domain/**'). This protects module-level health.
  coverageThreshold: {
    global: { lines: 18, branches: 15 },              // Presentation remainder (components/app/hooks): 21.35/18.57
    "./domain/": { lines: 70, branches: 68 },         // 71.05/71.12
    "./application/": { lines: 80, branches: 62 },    // 81.32/65.79
    "./infrastructure/": { lines: 64, branches: 58 }, // 69.65/63.74
    "./Interfaces/": { lines: 90, branches: 92 },     // 95.45/96.88
    "./lib/": { lines: 88, branches: 73 },            // 90.23/76.82
  },
};