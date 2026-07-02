// Phase 1 · T-0.6 — Duplicate-definition guard.
//
// A narrow, dedicated ESLint config used ONLY to detect duplicate class
// members and duplicate object keys — the JS/TS equivalent of the historical
// backend bug class (a method silently redefined within the same class,
// Document 09 §9). This is intentionally NOT the project's full lint config:
// `expo lint` currently reports 38 pre-existing, unrelated problems (unused
// vars, react-hooks/exhaustive-deps, etc. — see engineering-debt.md ED-005),
// and gating CI on that noisy baseline would block unrelated merges. This
// guard checks only the two rules relevant to duplicate-definition
// detection, so it stays reliable and false-positive-free.
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactHooksPlugin = require('eslint-plugin-react-hooks');

module.exports = [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['node_modules/**', 'dist/**', '.expo/**'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    // `react-hooks` is registered (but not enabled) solely so this file's
    // pre-existing `eslint-disable-line react-hooks/exhaustive-deps` comments
    // resolve to a known rule — otherwise flat-config errors on any inline
    // disable comment referencing a rule from an unregistered plugin, which
    // is a config artifact, not a duplicate-detection finding.
    plugins: { '@typescript-eslint': tsPlugin, 'react-hooks': reactHooksPlugin },
    rules: {
      'no-dupe-keys': 'error',
      '@typescript-eslint/no-dupe-class-members': 'error',
    },
  },
];
