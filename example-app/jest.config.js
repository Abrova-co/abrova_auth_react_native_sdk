module.exports = {
  preset: 'react-native',
  // Test against the SDK source in this repository (the app depends on it with "file:..").
  moduleNameMapper: {
    '^@abrova/auth-react-native$': '<rootDir>/../src/index.ts',
  },
  // Lets the SDK source resolve the app's Babel runtime helpers.
  modulePaths: ['<rootDir>/node_modules'],
};
