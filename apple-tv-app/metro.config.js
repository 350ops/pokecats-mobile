const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Allow CommonJS modules (Supabase uses them).
defaultConfig.resolver.sourceExts = [...defaultConfig.resolver.sourceExts, 'cjs'];

module.exports = mergeConfig(defaultConfig, {});
