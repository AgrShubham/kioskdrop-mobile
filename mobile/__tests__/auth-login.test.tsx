import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { kioskApi } from "@/lib/api";

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

const MOCK_LOGIN_RESPONSE = {
  success: true as const,
  message: "Authenticated as Priya Patel (IT_ADMIN)",
  session: {
    userId: "usr_it_02",
    name: "Priya Patel",
    email: "priya.patel@enterprise.corp",
    department: "Enterprise Infrastructure & AV Operations",
    role: "IT_ADMIN" as const,
    rfidBadgeId: "RFID-IT-0042",
  },
  token: "test_signed_hmac_it_admin_token",
};

const createdClients: QueryClient[] = [];

function makeClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  createdClients.push(client);
  return client;
}

describe("LoginScreen Authentication & Persona Selection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(kioskApi, "getSessionCurrent").mockResolvedValue({
      success: true,
      authenticated: false,
      session: null,
      availableUsers: [],
    });
  });

  afterEach(async () => {
    await cleanup();
    for (const client of createdClients.splice(0)) {
      client.clear();
    }
    jest.restoreAllMocks();
  });

  it("renders branding, credentials fields, and authenticate button by default", async () => {
    const client = makeClient();
    const view = await render(
      <QueryClientProvider client={client}>
        <LoginScreen />
      </QueryClientProvider>
    );

    expect(view.getByText("KioskDrop")).toBeTruthy();
    expect(
      view.getByText("Zero-Trust Hardware Access & Fleet Gateway")
    ).toBeTruthy();
    expect(view.getByTestId("login-email-input")).toBeTruthy();
    expect(view.getByTestId("login-password-input")).toBeTruthy();
    expect(view.getByTestId("login-submit-button")).toBeTruthy();

    view.unmount();
  });

  it("authenticates with corporate credentials and persists session token", async () => {
    const loginSpy = jest
      .spyOn(kioskApi, "login")
      .mockResolvedValue(MOCK_LOGIN_RESPONSE);

    const client = makeClient();
    const view = await render(
      <QueryClientProvider client={client}>
        <LoginScreen />
      </QueryClientProvider>
    );

    const authBtn = view.getByTestId("login-submit-button");
    fireEvent.press(authBtn);

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        email: "aarav.sharma@enterprise.corp",
        password: "kiosk2026",
      });
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "kioskdrop_session_token",
        "test_signed_hmac_it_admin_token"
      );
    });

    view.unmount();
  });

  it("switches to Quick Demo tab and logs in as IT Admin with 1 tap", async () => {
    const loginSpy = jest
      .spyOn(kioskApi, "login")
      .mockResolvedValue(MOCK_LOGIN_RESPONSE);

    const client = makeClient();
    const view = await render(
      <QueryClientProvider client={client}>
        <LoginScreen />
      </QueryClientProvider>
    );

    // Switch to Quick Demo tab
    const demoTab = view.getByTestId("login-tab-demo");
    fireEvent.press(demoTab);

    await waitFor(() => {
      expect(view.getByTestId("demo-persona-IT_ADMIN")).toBeTruthy();
      expect(view.getByTestId("demo-persona-EMPLOYEE")).toBeTruthy();
      expect(view.getByTestId("demo-persona-FINOPS_AUDITOR")).toBeTruthy();
    });

    // Tap Priya Patel (IT Admin)
    const priyaCard = view.getByTestId("demo-persona-IT_ADMIN");
    fireEvent.press(priyaCard);

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        email: "priya.patel@enterprise.corp",
        role: "IT_ADMIN",
      });
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "kioskdrop_session_token",
        "test_signed_hmac_it_admin_token"
      );
    });

    view.unmount();
  });

  it("switches to RFID Tap tab and verifies badge entry", async () => {
    const loginSpy = jest
      .spyOn(kioskApi, "login")
      .mockResolvedValue(MOCK_LOGIN_RESPONSE);

    const client = makeClient();
    const view = await render(
      <QueryClientProvider client={client}>
        <LoginScreen />
      </QueryClientProvider>
    );

    // Switch to RFID tab
    const rfidTab = view.getByTestId("login-tab-rfid");
    fireEvent.press(rfidTab);

    await waitFor(() => {
      expect(view.getByTestId("login-rfid-submit-button")).toBeTruthy();
    });

    const verifyBtn = view.getByTestId("login-rfid-submit-button");
    fireEvent.press(verifyBtn);

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        rfidBadgeId: "RFID-EMP-8821",
      });
    });

    view.unmount();
  });
});
