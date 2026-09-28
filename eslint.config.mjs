import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// technical-plan §4.8: the data engine and the brief must be deterministic.
const determinismRestrictions = [
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.object.name='Date'][callee.property.name='now']",
    message: "Date.now() is banned under lib/data and lib/brief (§4.8). Use the demo clock.",
  },
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.object.name='Math'][callee.property.name='random']",
    message: "Math.random() is banned under lib/data and lib/brief (§4.8). Use the seeded PRNG.",
  },
  {
    selector: "NewExpression[callee.name='Date'][arguments.length=0]",
    message: "Argument-less new Date() is banned under lib/data and lib/brief (§4.8).",
  },
  {
    selector: "CallExpression[callee.name='Date'][arguments.length=0]",
    message: "Date() reads the wall clock and is banned under lib/data and lib/brief (§4.8).",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["lib/data/**/*.{ts,tsx,js,mjs}", "lib/brief/**/*.{ts,tsx,js,mjs}"],
    rules: {
      "no-restricted-syntax": ["error", ...determinismRestrictions],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    ".design/**",
    ".claude/**",
    "backlog/**",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
