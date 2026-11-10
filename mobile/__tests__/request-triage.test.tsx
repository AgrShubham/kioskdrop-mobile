import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import RapidDropRequestScreen from "../app/(tabs)/request";
import { kioskApi } from "@/lib/api";

type LockersResponse = Awaited<ReturnType<typeof kioskApi.getLockers>>;
type RoomsResponse = Awaited<ReturnType<typeof kioskApi.getRooms>>;

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

const MOCK_ROOMS: RoomsResponse = {
  success: true,
  rooms: [
    {
      id: "rm_4b",
      name: "Executive Boardroom 4B",
      floor: 4,
      building: "Tower-A",
      displayType: "4K_LED_WALL",
      roomSystem: "BYOD_LEGACY",
      qrCodeSlug: "Boardroom-4B",
    },
    {
      id: "rm_3c",
      name: "Client Pitch Suite 3C",
      floor: 3,
      building: "Tower-A",
      displayType: "4K_LED_WALL",
      roomSystem: "BYOD_LEGACY",
      qrCodeSlug: "Client-Pitch-3C",
    },
  ],
};

const MOCK_LOCKERS: LockersResponse = {
  success: true,
  lockers: [
    {
      id: "lkr_floor4",
      name: "Floor 4 Boardroom Hub",
      floor: 4,
      locationNote: "Outside Boardroom 4B",
      onlineStatus: true,
      lastHeartbeatAt: null,
      temperatureC: 22.8,
      compartments: [],
    },
    {
      id: "lkr_floor2",
      name: "Floor 2 Townhall Hub",
      floor: 2,
      locationNote: "Townhall West",
      onlineStatus: true,
      lastHeartbeatAt: null,
      temperatureC: 23.1,
      compartments: [],
    },
  ],
};

const createdClients: QueryClient[] = [];

async function renderScreen() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  createdClients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <RapidDropRequestScreen />
    </QueryClientProvider>
  );
}

describe("RapidDropRequestScreen & PinPassCard integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(kioskApi, "getRooms").mockResolvedValue(MOCK_ROOMS);
    jest.spyOn(kioskApi, "getLockers").mockResolvedValue(MOCK_LOCKERS);
  });

  afterEach(async () => {
    await cleanup();
    for (const client of createdClients.splice(0)) {
      client.clear();
    }
    jest.restoreAllMocks();
  });

  it("shows Floor 3 -> Floor 4 fallback notice, overrides SKU on portDamaged, and renders PinPassCard with copy/deep-link", async () => {
    const reserveSpy = jest
      .spyOn(kioskApi, "diagnoseAndReserve")
      .mockResolvedValue({
        success: true,
        ticketId: "tkt_01",
        itsmTicketNumber: "INC0049102",
        locker: {
          id: "lkr_floor4",
          name: "Floor 4 Boardroom Hub",
          floor: 4,
          compartmentNumber: 2,
        },
        allocatedAsset: {
          id: "ast_02",
          serialNumber: "SN-BARCO-400W-01",
          skuName: "Barco CS-400W 4K Wireless HDMI Kit",
          usbVendorId: "0x0600",
          usbProductId: "0x400W",
        },
        accessPin: "489210",
        expiresAt: new Date(Date.now() + 9 * 60_000).toISOString(),
      });

    await renderScreen();

    await waitFor(() => {
      expect(screen.getByText("Client-Pitch-3C")).toBeTruthy();
    });

    // Switch to Floor 3 room -> verify Floor 4 hub fallback proximity notice
    await fireEvent.press(screen.getByText("Client-Pitch-3C"));
    await waitFor(() => {
      expect(
        screen.getByText("Nearest Hub Routing: Floor 3 -> Floor 4 Floor 4 Boardroom Hub")
      ).toBeTruthy();
    });

    // Toggle portDamaged switch on SYMPTOM_NO_DISPLAY_BYOD
    await fireEvent(screen.getByTestId("port-damaged-switch"), "valueChange", true);
    expect(
      screen.getAllByText(/Barco CS-400W 4K Wireless HDMI Kit/).length
    ).toBeGreaterThanOrEqual(1);

    await fireEvent.press(screen.getByText("Diagnose & Reserve Hardware"));

    await waitFor(() => {
      expect(reserveSpy).toHaveBeenCalledWith(
        {
          meetingRoomId: "rm_3c",
          qrCodeSlug: "Client-Pitch-3C",
          symptomCode: "SYMPTOM_NO_DISPLAY_BYOD",
          portDamaged: true,
        },
        expect.stringMatching(/^idemp_mob_/)
      );
    });

    // PinPassCard rendered with 6-digit PIN & ITSM badge
    await waitFor(() => {
      expect(screen.getByText("489210")).toBeTruthy();
      expect(screen.getByText("INC0049102")).toBeTruthy();
    });

    await fireEvent.press(screen.getByText("Copy PIN"));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith("489210");

    await fireEvent.press(screen.getByText("Open in Locker Kiosk"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/kiosk",
      params: {
        locker: "lkr_floor4",
        bay: "2",
        pin: "489210",
      },
    });
  });

  it("guards masked ****** PIN on idempotency-key replay without exposing Copy or forwarding ?pin=******", async () => {
    jest.spyOn(kioskApi, "diagnoseAndReserve").mockResolvedValue({
      success: true,
      ticketId: "tkt_replay",
      itsmTicketNumber: "INC0049099",
      locker: {
        id: "lkr_floor4",
        name: "Floor 4 Boardroom Hub",
        floor: 4,
        compartmentNumber: 1,
      },
      allocatedAsset: {
        id: "ast_01",
        serialNumber: "SN-ANK-8821",
        skuName: "Anker 60W USB-C to HDMI Adapter",
        usbVendorId: "0x291A",
        usbProductId: "0x8338",
      },
      accessPin: "******",
      expiresAt: new Date(Date.now() + 8 * 60_000).toISOString(),
    });

    await renderScreen();

    await waitFor(() => {
      expect(screen.getByText("Boardroom-4B")).toBeTruthy();
    });

    await fireEvent.press(screen.getByText("Diagnose & Reserve Hardware"));

    await waitFor(() => {
      expect(
        screen.getByText("Duplicate Reservation Replay (PIN Masked)")
      ).toBeTruthy();
    });

    expect(screen.queryByText("Copy PIN")).toBeNull();
    await fireEvent.press(screen.getByText("Open in Locker Kiosk"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/kiosk",
      params: {
        locker: "lkr_floor4",
        bay: "1",
      },
    });
  });
});
