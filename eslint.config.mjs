import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Legacy screens are being typed incrementally; keep every occurrence visible
    // without making unrelated safety rules impossible to enforce in CI.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "Open-ClaudeCode/**",
    ".agents/**",
    "agentskills-template/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "check_db.cjs",
    "check_db.js",
    "refactor_agenda.js",
    "scan.js",
  ]),
]);

export default eslintConfig;
