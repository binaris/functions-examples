module.exports = {
  env: { mocha: true },
  extends: 'airbnb-base',
  plugins: ['import'],
  rules: {
    'consistent-return': 'off',
    'multiline-comment-style': ['error', 'starred-block'],
    'max-len': [
      'error',
      {
        code: 120,
        comments: 120,
        ignoreUrls: true,
      },
    ],
    'no-console': 'off',
    'object-curly-newline': [
      'error',
      {
        multiline: true,
        minProperties: 5,
      },
    ],
  },
};
