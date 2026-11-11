import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import SmartLockerKioskScreen from "../app/(tabs)/kiosk";
import { ApiClientError, kioskApi } from "@/lib/api";

type LockersResponse = Awaited<ReturnType<typeof kioskApi.getLockers>>;
type SessionCurrentResponse = Awaited<ReturnType<typeof kioskApi.getSessionCurrent>>;

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

const MOCK_SESSION: SessionCurrentResponse = {
  success: true,
  session: {
    userId: "usr_emp_01",
    name: "Aarav Sharma",
    email: "aarav.sharma@kioskdrop.enterprise",
    department: "Sales & Strategic Accounts",
    role: "EMPLOYEE",
    rfidBadgeId: "RFID-EMP-8821",
  },
  availableUsers: [],
};

const MOCK_LOCKERS: LockersResponse = {
  success: true,
  lockers: [
    {
      id: "lkr_floor4",
      name: "Floor 4 Boardroom Hub",
      floor: 4,
      locationNote: "Outside Boardroom 4B North Wing",
      onlineStatus: true,
      lastHeartbeatAt: "2026-11-10T10:00:00.000Z",
      temperatureC: 22.8,
      compartments: [
        {
          id: "cmp_4_1",
          lockerId: "lkr_floor4",
          compartmentNumber: 1,
          status: "RESERVED_FOR_PICKUP",
          assetId: "ast_01",
          solenoidLocked: true,
          doorPhysicalOpen: false,
          irSensorBreakBeam: true,
          chargingConnected: true,
          asset: {
            id: "ast_01",
            skuId: "sku_usbc_hdmi_60w",
            serialNumber: "SN-ANK-8821",
            usbVendorId: "0x291A",
            usbProductId: "0x8338",
            hidWhitelisted: true,
            pkiCertStatus: "VALID",
            condition: "HEALTHY",
            availability: "RESERVED",
            sku: {
              id: "sku_usbc_hdmi_60w",
              name: "Anker 60W USB-C to HDMI Adapter",
              brand: "Anker",
              modelNumber: "A8338-PRO",
              category: "USB_C_ADAPTER",
              wholesalePricePaise: 45000,
              retailPricePaise: 185000,
              reorderThreshold: 3,
              reorderQuantity: 10,
              tariffRateId: "trf_01",
              dpAltMode: true,
              powerDeliveryWatts: 60,
              hdcp22Compliant: true,
            },
          },
          tickets: [],
        },
      ],
    },
  ],
};

const createdClients: QueryClient[] = [];

async function renderWithQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  createdClients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <SmartLockerKioskScreen />
    </QueryClientProvider>
  );
}

describe("SmartLockerKioskScreen & NumericKeypad integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(kioskApi, "getSessionCurrent").mockResolvedValue(MOCK_SESSION);
  });

  afterEach(async () => {
    await cleanup();
    for (const client of createdClients.splice(0)) {
      client.clear();
    }
    jest.restoreAllMocks();
  });

  it("disables ENTER, RFID, and Biometric while lockers are loading without showing PIN validation error", async () => {
    jest
      .spyOn(kioskApi, "getLockers")
      .mockReturnValue(new Promise<LockersResponse>(() => {}));

    await renderWithQueryClient();

    expect(
      screen.getByText("Connecting to Smart Locker IoT Controller...")
    ).toBeTruthy();

    expect(screen.getByTestId("keypad-key-ENTER").props.accessibilityState?.disabled).toBe(true);
    expect(screen.getByTestId("kiosk-rfid-button").props.accessibilityState?.disabled).toBe(true);
    expect(screen.getByTestId("kiosk-biometric-button").props.accessibilityState?.disabled).toBe(true);
    expect(screen.queryByText("Please enter a valid 6-digit PIN.")).toBeNull();
  });

  it("shows Retry Connection banner on /api/lockers error and never shows invalid PIN error", async () => {
    jest
      .spyOn(kioskApi, "getLockers")
      .mockRejectedValue(new Error("Unable to reach KioskDrop API at http://10.0.2.2:3000"));

    await renderWithQueryClient();

    await waitFor(() => {
      expect(screen.getByText("Smart Locker Hub Offline / Unreachable")).toBeTruthy();
    });

    expect(screen.getByText("Retry Connection")).toBeTruthy();
    expect(screen.getByTestId("keypad-key-ENTER").props.accessibilityState?.disabled).toBe(true);
    expect(screen.queryByText("Please enter a valid 6-digit PIN.")).toBeNull();
  });

  it("shows PIN validation banner on <6 digits, clears error on digit or CLEAR, and submits 6-digit PIN", async () => {
    jest.spyOn(kioskApi, "getLockers").mockResolvedValue(MOCK_LOCKERS);
    const unlockSpy = jest
      .spyOn(kioskApi, "authenticateAndUnlock")
      .mockResolvedValue({
        success: true,
        unlockedCompartment: 1,
        solenoidReleased: true,
        assetSerialNumber: "SN-ANK-8821",
        skuName: "Anker 60W USB-C to HDMI Adapter",
        message: "Unlocked bay 1",
      });

    await renderWithQueryClient();

    await waitFor(() => {
      expect(screen.getAllByText("Floor 4 Boardroom Hub").length).toBeGreaterThanOrEqual(1);
    });

    await fireEvent.press(screen.getByTestId("keypad-key-1"));
    await fireEvent.press(screen.getByTestId("keypad-key-2"));
    await fireEvent.press(screen.getByTestId("keypad-key-3"));
    await fireEvent.press(screen.getByTestId("keypad-key-ENTER"));

    expect(screen.getByText("Please enter a valid 6-digit PIN.")).toBeTruthy();
    expect(Haptics.notificationAsync).toHaveBeenCalled();

    // Tapping next digit immediately clears stale validation error
    await fireEvent.press(screen.getByTestId("keypad-key-4"));
    expect(screen.queryByText("Please enter a valid 6-digit PIN.")).toBeNull();

    // CLEAR also resets PIN & errors
    await fireEvent.press(screen.getByTestId("keypad-key-CLEAR"));
    await fireEvent.press(screen.getByTestId("keypad-key-ENTER"));
    expect(screen.getByText("Please enter a valid 6-digit PIN.")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("keypad-key-CLEAR"));
    expect(screen.queryByText("Please enter a valid 6-digit PIN.")).toBeNull();

    // Enter full 6 digits and submit
    for (const digit of ["4", "8", "9", "2", "1", "0"]) {
      await fireEvent.press(screen.getByTestId(`keypad-key-${digit}`));
    }
    await fireEvent.press(screen.getByTestId("keypad-key-ENTER"));

    await waitFor(() => {
      expect(unlockSpy).toHaveBeenCalledWith({
        lockerId: "lkr_floor4",
        authMethod: "PIN",
        credentialValue: "489210",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("kiosk-auth-success-banner")).toBeTruthy();
    });
  });

  it("handles 401 AUTH_FAILED (including 5th attempt message guard) and 423 LOCKER_LOCKED_OUT", async () => {
    jest.spyOn(kioskApi, "getLockers").mockResolvedValue(MOCK_LOCKERS);
    const unlockSpy = jest
      .spyOn(kioskApi, "authenticateAndUnlock")
      .mockRejectedValueOnce(
        new ApiClientError(
          401,
          "AUTH_FAILED",
          "Invalid PIN or unauthorized locker access. undefined attempt(s) remaining."
        )
      )
      .mockRejectedValueOnce(
        new ApiClientError(
          423,
          "LOCKER_LOCKED_OUT",
          "Too many failed authentication attempts. Locker locked for 15 minute(s)."
        )
      );

    await renderWithQueryClient();

    await waitFor(() => {
      expect(screen.getAllByText("Floor 4 Boardroom Hub").length).toBeGreaterThanOrEqual(1);
    });

    for (const digit of ["1", "1", "1", "1", "1", "1"]) {
      await fireEvent.press(screen.getByTestId(`keypad-key-${digit}`));
    }
    await fireEvent.press(screen.getByTestId("keypad-key-ENTER"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Invalid credentials. Security lockout activated for 15 minutes (5 failed attempts)."
        )
      ).toBeTruthy();
    });

    await fireEvent.press(screen.getByTestId("keypad-key-ENTER"));

    await waitFor(() => {
      expect(unlockSpy).toHaveBeenCalledTimes(2);
      expect(
        screen.getByText(
          "Too many failed authentication attempts. Locker locked for 15 minute(s)."
        )
      ).toBeTruthy();
    });
  });

  it("supports RFID badge tap and Biometric Face/Touch ID unlock with BIO-TMPL payload", async () => {
    jest.spyOn(kioskApi, "getLockers").mockResolvedValue(MOCK_LOCKERS);
    const unlockSpy = jest
      .spyOn(kioskApi, "authenticateAndUnlock")
      .mockResolvedValue({
        success: true,
        unlockedCompartment: 1,
        solenoidReleased: true,
        assetSerialNumber: "SN-ANK-8821",
        skuName: "Anker 60W USB-C to HDMI Adapter",
        message: "Solenoid unlocked",
      });

    await renderWithQueryClient();

    await waitFor(() => {
      expect(screen.getAllByText("Floor 4 Boardroom Hub").length).toBeGreaterThanOrEqual(1);
    });

    await fireEvent.press(screen.getByTestId("kiosk-rfid-button"));
    await waitFor(() => {
      expect(unlockSpy).toHaveBeenCalledWith({
        lockerId: "lkr_floor4",
        authMethod: "RFID",
        credentialValue: "RFID-EMP-8821",
      });
    });

    await act(async () => {
      await fireEvent.press(screen.getByTestId("kiosk-biometric-button"));
    });

    await waitFor(() => {
      expect(LocalAuthentication.authenticateAsync).toHaveBeenCalled();
      expect(unlockSpy).toHaveBeenCalledWith({
        lockerId: "lkr_floor4",
        authMethod: "BIOMETRIC",
        credentialValue: "BIO-TMPL",
      });
    });
  });
});
