import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/'] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Our assertion helpers call expect() internally, so count them as assertions.
      'playwright/expect-expect': [
        'error',
        { assertFunctionNames: ['assertJsonResponse', 'assertMatchesSchema'] },
      ],
    },
  },
  prettier,
);
