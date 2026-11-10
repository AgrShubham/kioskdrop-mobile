/// <reference types="jest" />

import React from "react";

// In-memory store backing expo-secure-store
const mockSecureStoreMemory = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStoreMemory.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStoreMemory.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStoreMemory.delete(key);
  }),
  isAvailableAsync: jest.fn(async () => true),
  __store: mockSecureStoreMemory,
}));

// Official AsyncStorage Jest mock
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Haptics mock
jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: {
    Light: "Light",
    Medium: "Medium",
    Heavy: "Heavy",
  },
  NotificationFeedbackType: {
    Success: "Success",
    Warning: "Warning",
    Error: "Error",
  },
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  selectionAsync: jest.fn(async () => undefined),
}));

// LocalAuthentication mock
jest.mock("expo-local-authentication", () => ({
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  supportedAuthenticationTypesAsync: jest.fn(async () => [1, 2]),
  authenticateAsync: jest.fn(async () => ({ success: true })),
}));

// Clipboard mock
jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(async () => true),
  getStringAsync: jest.fn(async () => ""),
}));

// Camera mock
jest.mock("expo-camera", () => {
  const MockReact = require("react");
  const { View } = require("react-native");
  const CameraView = (props: Record<string, unknown>) =>
    MockReact.createElement(View, { testID: "mock-camera-view", ...props });
  return {
    CameraView,
    useCameraPermissions: jest.fn(() => [
      { granted: true, canAskAgain: true, status: "granted" },
      jest.fn(async () => ({ granted: true, canAskAgain: true, status: "granted" })),
    ]),
  };
});

// Controllable EventSource mock for react-native-sse
jest.mock("react-native-sse", () => {
  class MockEventSource {
    static instances: MockEventSource[] = [];
    url: string;
    options?: Record<string, unknown>;
    listeners: Map<
      string,
      Set<(event: { type: string; data?: string; lastEventId?: string }) => void>
    > = new Map();
    closed = false;

    constructor(url: string, options?: Record<string, unknown>) {
      this.url = url;
      this.options = options;
      MockEventSource.instances.push(this);
    }

    addEventListener(
      type: string,
      listener: (event: {
        type: string;
        data?: string;
        lastEventId?: string;
      }) => void
    ) {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set());
      }
      this.listeners.get(type)?.add(listener);
    }

    removeEventListener(
      type: string,
      listener: (event: {
        type: string;
        data?: string;
        lastEventId?: string;
      }) => void
    ) {
      this.listeners.get(type)?.delete(listener);
    }

    close() {
      this.closed = true;
    }

    __emit(type: string, data?: unknown, lastEventId?: string) {
      const payload = {
        type,
        data: typeof data === "string" ? data : data !== undefined ? JSON.stringify(data) : undefined,
        lastEventId,
      };
      this.listeners.get(type)?.forEach((fn) => fn(payload));
    }
  }

  return {
    __esModule: true,
    default: MockEventSource,
  };
});

// Reanimated mock
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Safe Area Context mock for deterministic RNTL rendering
jest.mock("react-native-safe-area-context", () => {
  const MockReact = require("react");
  const { View } = require("react-native");
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      MockReact.createElement(View, null, children),
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) =>
      MockReact.createElement(View, props, children),
    SafeAreaInsetsContext: MockReact.createContext(inset),
    SafeAreaFrameContext: MockReact.createContext(frame),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { insets: inset, frame },
  };
});

// Clear mockSecureStoreMemory cleanly if needed in tests
export { mockSecureStoreMemory as secureStoreMemory };
