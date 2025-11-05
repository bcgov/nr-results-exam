import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        },
        project: null
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        React: 'readonly',
        JSX: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsdoc': jsdocPlugin,
      'import': importPlugin,
      'jsx-a11y': jsxA11yPlugin,
      'unused-imports': unusedImportsPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...jsdocPlugin.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      // For ESLint v9 flat config, use the flat config export if available; otherwise, specify rules manually.
      ...(jsxA11yPlugin.configs['flat/recommended'] ? jsxA11yPlugin.configs['flat/recommended'].rules : {}),
      // If the above is empty, manually specify jsx-a11y rules here for ESLint v9 compatibility.
      'indent': ['error', 2, { 'SwitchCase': 1 }],
      'react/require-default-props': 'off',
      'linebreak-style': 0,
      'react/jsx-filename-extension': [2, { 'extensions': ['.js', '.jsx', '.ts', '.tsx'] }],
      'comma-dangle': ['error', 'never'],
      'import/no-extraneous-dependencies': ['error', { 'devDependencies': true }],
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          'js': 'never',
          'jsx': 'never',
          'ts': 'never',
          'tsx': 'never'
        }
      ],
      'import/prefer-default-export': 'off',
      'react/function-component-definition': [
        'error',
        {
          'namedComponents': ['function-declaration', 'arrow-function'],
          'unnamedComponents': 'arrow-function'
        }
      ],
      'jsx-a11y/label-has-associated-control': [2, { 'depth': 3 }],
      'no-shadow': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-shadow': ['error'],
      '@typescript-eslint/no-unused-vars': 'error',
      'jsdoc/require-param': 0,
      'jsdoc/require-returns': 0,
      'jsdoc/tag-lines': 0,
      'import/namespace': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { 'vars': 'all', 'varsIgnorePattern': '^_', 'args': 'after-used', 'argsIgnorePattern': '^_' }
      ]
    },
    settings: {
      'import/resolver': {
        'node': {
          'extensions': ['.js', '.jsx', '.ts', '.tsx']
        }
      },
      'react': {
        'version': 'detect'
      }
    }
  },
  {
    ignores: ['**/__test__/*', '**/assets/*', '**/*.scss', '**/*.css', '**/*.svg', 'build/**', 'node_modules/**']
  }
];
