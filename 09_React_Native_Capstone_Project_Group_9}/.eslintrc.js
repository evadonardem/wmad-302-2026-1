// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  rules: {
    // TypeScript interfaces already describe props; the React prop-types rule is
    // only relevant for plain JavaScript projects.
    'react/prop-types': 'off',
  },
  settings: {
    // Resolve the "@/..." aliases declared in babel.config.js and tsconfig.json
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};

