import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts']),

  js.configs.recommended,
  // Type-aware rules: catch floating promises, unsafe `any` flow, etc.
  tseslint.configs.strictTypeChecked,
  // React hook rules and Next.js best practices.
  reactHooks.configs.flat['recommended-latest'],
  nextPlugin.configs['core-web-vitals'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      // `const { secret, ...rest } = obj` is the idiomatic way to drop a field: allow it.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      // Event handlers like onClick={() => mutate()} are fine to fire and forget in React.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      // Numbers in JSX template strings are normal UI copy.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },

  // Plain JS config files aren't part of any tsconfig, so skip type-aware rules for them.
  { files: ['**/*.{js,mjs,cjs}'], extends: [tseslint.configs.disableTypeChecked] },

  // Must be last: turns off rules that would fight Prettier's formatting.
  prettier,
);
