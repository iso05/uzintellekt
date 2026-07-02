import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import boundaries from 'eslint-plugin-boundaries'

// ── FSD layer rules ───────────────────────────────────────────────
// Each layer may only import from layers BELOW it.
// app → pages → widgets → features → entities → shared
const FSD_LAYERS = [
  { type: 'app',      pattern: 'src/app/**' },
  { type: 'pages',    pattern: 'src/pages/*',    mode: 'folder' },
  { type: 'widgets',  pattern: 'src/widgets/*',  mode: 'folder' },
  { type: 'features', pattern: 'src/features/*', mode: 'folder' },
  { type: 'entities', pattern: 'src/entities/*', mode: 'folder' },
  { type: 'shared',   pattern: 'src/shared/**' },
]

const FSD_DEPENDENCY_RULES = [
  { from: { type: 'app' },      allow: { to: { type: ['pages', 'widgets', 'features', 'entities', 'shared'] } } },
  { from: { type: 'pages' },    allow: { to: { type: ['widgets', 'features', 'entities', 'shared'] } } },
  { from: { type: 'widgets' },  allow: { to: { type: ['features', 'entities', 'shared'] } } },
  { from: { type: 'features' }, allow: { to: { type: ['entities', 'shared'] } } },
  { from: { type: 'entities' }, allow: { to: { type: ['shared'] } } },
  { from: { type: 'shared' },   allow: { to: { type: ['shared'] } } },
]

export default [
  { ignores: ['dist/**', 'node_modules/**', 'build/**', '.vite/**'] },

  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    settings: {
      react: { version: 'detect' },
      'boundaries/elements': FSD_LAYERS,
      'boundaries/include': ['src/**/*'],
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      boundaries,
    },
    rules: {
      // React baseline
      ...react.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unknown-property': 'warn',
      'react/no-unescaped-entities': 'off',

      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Core
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'debug'] }],

      // FSD boundaries (boundaries v6 syntax: dependencies + object selectors)
      'boundaries/dependencies': [
        'error',
        { default: 'disallow', rules: FSD_DEPENDENCY_RULES },
      ],
    },
  },

  {
    files: ['*.config.{js,mjs}', '*.cjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
]
