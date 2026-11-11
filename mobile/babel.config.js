const path = require("path");

module.exports = function (api) {
  api.cache(true);
  const babelPresetExpo = require.resolve("babel-preset-expo", {
    paths: [__dirname, path.dirname(require.resolve("expo/package.json"))],
  });

  return {
    presets: [
      [babelPresetExpo, { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: ["react-native-reanimated/plugin"],
  };
};
