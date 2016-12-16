module.exports = {
  root: true,
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module'
  },
  extends: 'airbnb-base',
  env: {
    'browser': true,
    'node': false,
  },
  ecmaFeatures: {
    arrowFunctions: true,
    blockBindings: true,
    classes: true,
    defaultParams: true,
    destructuring: true,
    forOf: false,
    generators: false,
    modules: true,
    objectLiteralComputedProperties: true,
    objectLiteralDuplicateProperties: false,
    objectLiteralShorthandMethods: true,
    objectLiteralShorthandProperties: true,
    restParams: true,
    spread: true,
    superInFunctions: false,
    templateStrings: true,
    jsx: false,
  },
  rules: {
    'arrow-body-style': 0,
    'comma-dangle': 0,
    'prefer-const': 1,
    'func-names': 0,
    'prefer-arrow-callback': 0,
    'no-restricted-syntax': ['error', 'ForOfStatement', 'WithStatement'],
    'curly': 2,
    'no-implicit-coercion': [2, {
      'number': true,
      'string': true,
    }],
    'import/no-unresolved': 0,
    'no-underscore-dangle': 0,
    'prefer-rest-params': 0,
  }
};
