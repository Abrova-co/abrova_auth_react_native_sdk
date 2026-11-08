const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const sdkRoot = path.resolve(__dirname, '..');
const escape = (p) => p.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
// The SDK's own tests install react and react-native in its node_modules; the app must use only its own copies.
const appOnly = ['react', 'react-native'];

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [sdkRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(sdkRoot, 'node_modules'),
    ],
    blockList: appOnly.map((name) => new RegExp(`^${escape(path.join(sdkRoot, 'node_modules', name))}\\/.*$`)),
    extraNodeModules: Object.fromEntries(appOnly.map((name) => [name, path.resolve(__dirname, 'node_modules', name)])),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
