module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // If you re-enable NativeWind, add 'nativewind/babel' back into plugins
    // once the plugin is compatible with your Expo/Babel version.
  };
};

