module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module'
  },
  extends: 'eslint:recommended',
  env: {
    browser: true
  },
  rules: {
    'arrow-body-style': 'off',
    'comma-dangle': ['warn', 'always-multiline'],
    'consistent-return': 'off',
    'curly': 'error',
    'func-names': 'off',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',
    'max-len': ['warn', {
      code: 110,
      tabWidth: 2
    }],
    'no-implicit-coercion': ['error', {
      boolean: false,
      number: true,
      string: true,
    }],
    'no-restricted-syntax': ['error', 'ForOfStatement', 'WithStatement'],
    'no-underscore-dangle': 'off',
    'prefer-arrow-callback': 'off',
    'prefer-const': 'warn',
    'prefer-rest-params': 'off',
  },
};
