module.exports = {
  preset: 'react-native',
  // Test against the SDK source in this repository (the app depends on it with "file:..").
  moduleNameMapper: {
    '^@abrova/auth-react-native$': '<rootDir>/../src/index.ts',
    '^@abrova/auth-react-native/ui$': '<rootDir>/../src/ui.ts',
    // One React: the app's, never the copy the SDK's own tests install.
    '^react(/.*)?$': '<rootDir>/node_modules/react$1',
    '^react-native$': '<rootDir>/node_modules/react-native',
  },
  // Lets the SDK source resolve the app's Babel runtime helpers.
  modulePaths: ['<rootDir>/node_modules'],
};
