import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";

// eslint-config-next 15 ships eslintrc-style configs; FlatCompat adapts them to ESLint 9.
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "node_modules/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);
