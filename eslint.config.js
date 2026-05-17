import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'functions/api/_bodies.ts']),
  // Frontend (browser runtime)
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettier,
    ],
    languageOptions: { globals: globals.browser },
  },
  // Cloudflare Pages Functions (Workers runtime — browser-API-compatible + some Node compat)
  {
    files: ['functions/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended, prettier],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  // Build scripts (Node runtime via tsx)
  {
    files: ['scripts/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended, prettier],
    languageOptions: { globals: globals.node },
  },
])
