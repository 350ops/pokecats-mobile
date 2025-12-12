module.exports = {
  root: true,
  extends: ['eslint-config-react-native'],
  env: {
    jest: true,
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
  },
};
