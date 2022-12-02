module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: ['standard-with-typescript', 'eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  overrides: [],
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    /* custom */
  }
}
