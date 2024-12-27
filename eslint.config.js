import globals from "globals";
import pluginJs from "@eslint/js";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
  // Add select good practice rules
  {
    rules: {
      eqeqeq: ["error"],
    }
  },

  // Turn on all rules and switch some off
  pluginJs.configs.all,
  {
    rules: {
      "capitalized-comments": "off",
      "curly": "off",
      "func-style": ["error", "declaration"],
      "id-length": "off",
      "max-lines-per-function": "off",
      "max-statements": "off",
      "new-cap": "off", // Vercel requires export to be called GET()
      "no-inline-comments": "off",
      "no-magic-numbers": "off",
      "no-ternary": "off",
      "no-undefined": "off",
      "no-use-before-define": ["error", "nofunc"],
      "one-var": "off",
      "prefer-destructuring": "off",
      "prefer-regex-literals": "off",
      "prefer-template": "off",
      "sort-keys": "off",
    },
  }
];