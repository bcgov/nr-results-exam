import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      'indent': ['error', 2, { 'SwitchCase': 1 }],
      'linebreak-style': 0,
      'quotes': ['error', 'single', { 'avoidEscape': true }],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'no-console': 'off',
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_', 'caughtErrorsIgnorePattern': '^_' }]
    }
  },
  {
    ignores: ['node_modules/**', 'coverage/**', 'dist/**', '*.min.js', 'eslint.config.js']
  }
];
