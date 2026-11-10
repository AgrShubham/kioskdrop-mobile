import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import AdminCommandCenterScreen from "../app/(tabs)/admin";
import { AssetRegistrySection } from "@/components/admin/AssetRegistrySection";
import { kioskApi } from "@/lib/api";
import type { AssetItem } from "@/types/domain";

type SessionCurrentResponse = Awaited<ReturnType<typeof kioskApi.getSessionCurrent>>;
type LandedCostApiResponse = Awaited<ReturnType<typeof kioskApi.computeLandedCost>>;

const EMPLOYEE_SESSION: SessionCurrentResponse = {
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

const IT_ADMIN_SESSION: SessionCurrentResponse = {
  success: true,
  session: {
    userId: "usr_it_02",
    name: "Priya Patel",
    email: "priya.patel@kioskdrop.enterprise",
    department: "Enterprise Infrastructure",
    role: "IT_ADMIN",
    rfidBadgeId: "RFID-IT-0042",
  },
  availableUsers: [],
};

const SAMPLE_ASSETS: AssetItem[] = [
  {
    id: "ast_badusb_risk_02",
    skuId: "sku_usbc_hdmi_60w",
    serialNumber: "SN-BADUSB-RUBBER-DUCKY-01",
    usbVendorId: "0x16C0",
    usbProductId: "0x05DF",
    hidWhitelisted: false,
    pkiCertStatus: "REVOKED",
    condition: "DAMAGED",
    availability: "QUARANTINED",
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
    compartment: null,
  },
];

const VECTOR_A_RESPONSE: LandedCostApiResponse = {
  success: true,
  cifAmountPaise: 100000,
  assessableValuePaise: 101000,
  bcdPaise: 20200,
  swsPaise: 2020,
  igstPaise: 22180,
  totalDutiesPaise: 44400,
  totalLandedCostPaise: 144400,
  effectiveCostNetOfItcPaise: 122220,
  procurementMode: "DIRECT_IMPORT",
  effectiveDutyRatePercent: 44.4,
  formatted: {
    cifINR: "₹1,000.00",
    assessableValueINR: "₹1,010.00",
    bcdINR: "₹202.00",
    swsINR: "₹20.20",
    igstINR: "₹221.80",
    totalDutiesINR: "₹444.00",
    totalLandedCostINR: "₹1,444.00",
    netCostAfterItcINR: "₹1,222.20",
  },
  rates: {
    bcdPercent: "20.00%",
    swsPercent: "10.00%",
    igstPercent: "18.00%",
  },
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

describe("Admin RBAC, Bearer persistence & Landed Cost calculator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(kioskApi, "getLockers").mockResolvedValue({
      success: true,
      lockers: [],
    });
  });

  afterEach(async () => {
    await cleanup();
    for (const client of createdClients.splice(0)) {
      client.clear();
    }
    jest.restoreAllMocks();
  });

  it("shows RbacBanner for EMPLOYEE, disables HID toggle controls, and persists Bearer token on role switch", async () => {
    const getSessionSpy = jest
      .spyOn(kioskApi, "getSessionCurrent")
      .mockResolvedValueOnce(EMPLOYEE_SESSION)
      .mockResolvedValue(IT_ADMIN_SESSION);

    const switchSpy = jest
      .spyOn(kioskApi, "switchRole")
      .mockResolvedValue({
        success: true,
        message: "Switched active persona to Priya Patel (IT_ADMIN)",
        session: IT_ADMIN_SESSION.session,
        token: "signed_it_admin_jwt_token_test",
      });

    const complianceSpy = jest
      .spyOn(kioskApi, "getCompliance")
      .mockResolvedValue({
        success: true,
        assets: SAMPLE_ASSETS.map((a) => ({
          ...a,
          sku: {
            ...a.sku!,
            tariffRate: {
              id: "trf_01",
              hsnCode: "85437099",
              description: "USB-C AV Hubs",
              bcdBp: 2000,
              swsBp: 1000,
              igstBp: 1800,
            },
          },
        })),
        tariffRates: [],
      });

    const client = makeClient();

    // First verify AssetRegistrySection directly enforces read-only toggle when role === EMPLOYEE
    const onToggle = jest.fn();
    const registryRender = await render(
      <AssetRegistrySection
        assets={SAMPLE_ASSETS}
        role="EMPLOYEE"
        togglingAssetId={null}
        onToggleWhitelist={onToggle}
      />
    );
    const empToggle = registryRender.getByTestId("hid-toggle-ast_badusb_risk_02");
    expect(empToggle.props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(empToggle);
    expect(onToggle).not.toHaveBeenCalled();
    await registryRender.unmount();

    // Now mount full Admin screen as EMPLOYEE
    await render(
      <QueryClientProvider client={client}>
        <AdminCommandCenterScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("rbac-switch-it-admin")).toBeTruthy();
      expect(screen.getByTestId("rbac-switch-finops")).toBeTruthy();
    });

    // Switch to IT Admin
    await fireEvent.press(screen.getByTestId("rbac-switch-it-admin"));

    await waitFor(() => {
      expect(switchSpy).toHaveBeenCalledWith({ role: "IT_ADMIN" });
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "kioskdrop_session_token",
        "signed_it_admin_jwt_token_test"
      );
    });

    // After invalidation + session reload, IT_ADMIN can fetch compliance and toggle HID
    await waitFor(() => {
      expect(getSessionSpy).toHaveBeenCalledTimes(2);
      expect(complianceSpy).toHaveBeenCalled();
      expect(screen.getByTestId("hid-toggle-ast_badusb_risk_02")).toBeTruthy();
    });

    expect(
      screen.getByTestId("hid-toggle-ast_badusb_risk_02").props.accessibilityState?.disabled
    ).toBe(false);
  });

  it("posts CIF/HSN/mode to landed-cost API and renders formatted INR duty breakdown", async () => {
    jest.spyOn(kioskApi, "getSessionCurrent").mockResolvedValue(EMPLOYEE_SESSION);
    const landedSpy = jest
      .spyOn(kioskApi, "computeLandedCost")
      .mockResolvedValue(VECTOR_A_RESPONSE);

    const client = makeClient();
    await render(
      <QueryClientProvider client={client}>
        <AdminCommandCenterScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("landed-cost-cif-input")).toBeTruthy();
    });

    await fireEvent.changeText(screen.getByTestId("landed-cost-cif-input"), "1000");
    await fireEvent.press(screen.getByTestId("compute-landed-cost-button"));

    await waitFor(() => {
      expect(landedSpy).toHaveBeenCalledWith({
        cifAmountINR: 1000,
        hsnCode: "85437099",
        procurementMode: "DIRECT_IMPORT",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("landed-cost-result")).toBeTruthy();
      expect(screen.getByText("₹444.00")).toBeTruthy();
      expect(screen.getByText("₹1,444.00")).toBeTruthy();
      expect(screen.getByText("₹1,222.20")).toBeTruthy();
    });
  });
});
