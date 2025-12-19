import eslint from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

/**
 * Shared ignore patterns
 */
const baseIgnores = [
  '**/assets/*',
  '**/*.scss',
  '**/*.css',
  '**/*.svg',
  '**/build/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/coverage/**',
];

/**
 * Shared ESLint rules
 */
const baseRules = {
  // Prettier integration
  'prettier/prettier': 'error',

  // General ESLint rules
  'no-console': 'off',
  'no-debugger': 'warn',
  'no-unused-vars': 'off',
  'no-empty': [ 'error', { allowEmptyCatch: true } ],
  'no-shadow': 'off',

  // TypeScript rules
  '@typescript-eslint/no-unused-vars': [
    'error',
    { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
  ],
  '@typescript-eslint/no-shadow': [ 'error' ],
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-non-null-assertion': 'off',
  '@typescript-eslint/no-empty-interface': 'off',
  '@typescript-eslint/ban-types': 'off',
  '@typescript-eslint/explicit-function-return-type': 'off',
};

export default [
  eslint.configs.recommended,
  prettierConfig,
  {
    files: [ '**/*.{js,jsx,ts,tsx}' ],
    ignores: [ ...baseIgnores ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: null,
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      prettier,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...baseRules,
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs[ 'jsx-runtime' ].rules,

      // React hooks rules (using only basic rules, not all recommended)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/require-default-props': 'off',
      'react/jsx-filename-extension': [ 2, { extensions: [ '.js', '.jsx', '.ts', '.tsx' ] } ],
      'react/function-component-definition': [
        'error',
        {
          namedComponents: [ 'function-declaration', 'arrow-function' ],
          unnamedComponents: 'arrow-function',
        },
      ],
    },
  },
  {
    // Test files configuration
    files: [ '**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}' ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: null,
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node, // Add node globals for 'global'
        React: 'readonly',
        JSX: 'readonly',
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      prettier,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...baseRules,
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs[ 'jsx-runtime' ].rules,
      // React hooks rules (using only basic rules, not all recommended)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/require-default-props': 'off',
      'react/jsx-filename-extension': [ 2, { extensions: [ '.js', '.jsx', '.ts', '.tsx' ] } ],
      'react/function-component-definition': [
        'error',
        {
          namedComponents: [ 'function-declaration', 'arrow-function' ],
          unnamedComponents: 'arrow-function',
        },
      ],
    },
  },
];
