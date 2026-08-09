import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        URLSearchParams: 'readonly',
        CustomEvent: 'readonly',
      },
    },
  },
];
