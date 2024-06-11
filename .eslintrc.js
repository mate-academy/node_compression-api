module.exports = {
  extends: '@mate-academy/eslint-config',
  env: {
    jest: true,
  },
  rules: {
    'no-proto': 0,
    'max-len': [2, { 'code': 100 }],
  },
  plugins: ['jest'],
};
