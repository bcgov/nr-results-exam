import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintReact from '@eslint-react/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

const baseIgnores = [
  '**/vite.config.*',
  '**/vitest.config.*',
  '**/playwright.config.*',
  '**/tsconfig*.json',
  '**/assets/*',
  '**/*.scss',
  '**/*.css',
  '**/*.svg',
  '**/build/**',
  '**/dist/**',
  '**/node_modules/**',
  '**/coverage/**',
];

export default defineConfig([
  {
    ignores: [...baseIgnores],
  },
  ...tseslint.configs.recommended,
  eslintReact.configs['recommended-typescript'],
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',

      'no-console': 'off',
      'no-debugger': 'warn',
      'no-unused-vars': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-shadow': 'off',

      '@typescript-eslint/no-unused-vars': [
        'error',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-shadow': ['error'],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  prettierConfig,
]);
