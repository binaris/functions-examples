module.exports = {
  extends: 'airbnb-base',
  plugins: ['import'],
  rules: {
    'max-len': [
      'error',
      {
        code: 120,
        comments: 120,
        ignoreUrls: true,
      },
    ],
    'newline-per-chained-call': [
      'error',
    ],
    'no-console': 'off',
    'object-curly-newline': [
      'error',
      {
        multiline: true,
        minProperties: 5,
      },
    ],
    'no-multi-spaces': [
      'error',
      { exceptions: { VariableDeclarator: true }}
    ]
  },
};
