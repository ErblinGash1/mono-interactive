export default [
  { ignores: ['dist/**', 'node_modules/**', '.local/**', 'test-results/**'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: {
      'no-unreachable': 'error',
      'no-constant-condition': 'error',
      'no-dupe-args': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-imports': 'error',
      'no-sparse-arrays': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
    },
  },
]
