module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^lucide-react-native$": "<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js",
  },
  testPathIgnorePatterns: ["/node_modules/", "/\\.expo/", "/dist/"],
  watchman: false,
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|lucide-react-native|react-native-gifted-charts|gifted-charts-core|react-native-sse|nativewind|react-native-css-interop|react-native-reanimated|react-native-worklets|@react-native-async-storage/async-storage|react-native-safe-area-context|react-native-screens))",
    "/node_modules/react-native-reanimated/plugin/",
    "/node_modules/@react-native/babel-preset/",
  ],
  testMatch: ["**/__tests__/**/*.(test|spec).(ts|tsx)"],
};
