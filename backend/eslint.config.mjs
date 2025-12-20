import eslint from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

/**
 * Shared ignore patterns
 */
const baseIgnores = ['**/node_modules/**', '**/coverage/**', '**/dist/**', '*.min.js'];

/**
 * Shared ESLint rules
 */
const baseRules = {
  // Prettier integration
  'prettier/prettier': 'error',

  // General ESLint rules
  'no-console': 'off',
  'no-debugger': 'warn',
  'no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
  ],
  'no-empty': ['error', { allowEmptyCatch: true }],
};

export default [
  eslint.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.js', '**/*.mjs'],
    ignores: [...baseIgnores],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      ...baseRules,
      // Additional backend-specific rules can be added here
    },
  },
];
