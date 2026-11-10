export type UserRole = "EMPLOYEE" | "IT_ADMIN" | "FINOPS_AUDITOR";

export const CompartmentStatus = {
  EMPTY: "EMPTY",
  STOCKED_AVAILABLE: "STOCKED_AVAILABLE",
  RESERVED_FOR_PICKUP: "RESERVED_FOR_PICKUP",
  DOOR_OPEN_AWAITING_REMOVAL: "DOOR_OPEN_AWAITING_REMOVAL",
  CHECKED_OUT: "CHECKED_OUT",
  MAINTENANCE_QUARANTINE: "MAINTENANCE_QUARANTINE",
} as const;

export type CompartmentStatusType =
  (typeof CompartmentStatus)[keyof typeof CompartmentStatus];

export const VALID_COMPARTMENT_TRANSITIONS: Record<
  CompartmentStatusType,
  CompartmentStatusType[]
> = {
  [CompartmentStatus.EMPTY]: [
    CompartmentStatus.STOCKED_AVAILABLE,
    CompartmentStatus.MAINTENANCE_QUARANTINE,
  ],
  [CompartmentStatus.STOCKED_AVAILABLE]: [
    CompartmentStatus.EMPTY,
    CompartmentStatus.RESERVED_FOR_PICKUP,
    CompartmentStatus.MAINTENANCE_QUARANTINE,
  ],
  [CompartmentStatus.RESERVED_FOR_PICKUP]: [
    CompartmentStatus.DOOR_OPEN_AWAITING_REMOVAL,
    CompartmentStatus.STOCKED_AVAILABLE,
    CompartmentStatus.MAINTENANCE_QUARANTINE,
  ],
  [CompartmentStatus.DOOR_OPEN_AWAITING_REMOVAL]: [
    CompartmentStatus.CHECKED_OUT,
    CompartmentStatus.STOCKED_AVAILABLE,
    CompartmentStatus.MAINTENANCE_QUARANTINE,
  ],
  [CompartmentStatus.CHECKED_OUT]: [
    CompartmentStatus.STOCKED_AVAILABLE,
    CompartmentStatus.MAINTENANCE_QUARANTINE,
  ],
  [CompartmentStatus.MAINTENANCE_QUARANTINE]: [
    CompartmentStatus.STOCKED_AVAILABLE,
    CompartmentStatus.EMPTY,
  ],
};

export const TicketStatus = {
  OPEN_RESERVED: "OPEN_RESERVED",
  DISPENSED_ACTIVE: "DISPENSED_ACTIVE",
  RETURNED_CLOSED: "RETURNED_CLOSED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
  OVERDUE_ESCALATED: "OVERDUE_ESCALATED",
} as const;

export type TicketStatusType =
  (typeof TicketStatus)[keyof typeof TicketStatus];

export const AssetCondition = {
  HEALTHY: "HEALTHY",
  NEEDS_INSPECTION: "NEEDS_INSPECTION",
  DAMAGED: "DAMAGED",
} as const;

export type AssetConditionType =
  (typeof AssetCondition)[keyof typeof AssetCondition];

export const AssetAvailability = {
  IN_LOCKER: "IN_LOCKER",
  RESERVED: "RESERVED",
  OUT: "OUT",
  QUARANTINED: "QUARANTINED",
} as const;

export type AssetAvailabilityType =
  (typeof AssetAvailability)[keyof typeof AssetAvailability];

export type TelemetryEventType =
  | "LOCKER_RESERVED"
  | "DOOR_UNLOCKED"
  | "ASSET_REMOVED"
  | "ASSET_RETURNED"
  | "SECURITY_MISMATCH_ALARM"
  | "TICKET_EXPIRED"
  | "TICKET_OVERDUE"
  | "INVENTORY_RESTOCKED";

export interface TelemetryEvent {
  id: string;
  type: TelemetryEventType;
  version: string;
  ts: string;
  payload: Record<string, unknown>;
}

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  rfidBadgeId: string;
}

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  rfidBadgeId: string;
}

export interface MeetingRoom {
  id: string;
  name: string;
  floor: number;
  building: string;
  displayType: string;
  roomSystem: string;
  qrCodeSlug: string;
}

export interface TariffRate {
  id: string;
  hsnCode: string;
  description: string;
  bcdBp: number;
  swsBp: number;
  igstBp: number;
  effectiveFrom?: string;
}

export interface HardwareSKU {
  id: string;
  name: string;
  brand: string;
  modelNumber: string;
  category: string;
  wholesalePricePaise: number;
  retailPricePaise: number;
  reorderThreshold: number;
  reorderQuantity: number;
  tariffRateId: string;
  tariffRate?: TariffRate;
  dpAltMode: boolean;
  powerDeliveryWatts: number;
  hdcp22Compliant: boolean;
  wirelessBand?: string | null;
  encryptionSpec?: string | null;
  wpcEtaCertNumber?: string | null;
  bisCrsNumber?: string | null;
}

export interface AssetItem {
  id: string;
  skuId: string;
  sku?: HardwareSKU;
  serialNumber: string;
  usbVendorId: string;
  usbProductId: string;
  hidWhitelisted: boolean;
  pkiCertStatus: string;
  condition: AssetConditionType | string;
  availability: AssetAvailabilityType | string;
  compartment?: {
    id: string;
    lockerId: string;
    compartmentNumber: number;
    status: CompartmentStatusType;
    locker?: {
      id: string;
      name: string;
      floor: number;
      locationNote: string;
    };
  } | null;
}

export interface LockerTicketSummary {
  id: string;
  itsmExternalId: string;
  status: TicketStatusType | string;
  expiresAt: string;
  reportedSymptom: string;
  user: {
    id: string;
    name: string;
    rfidBadgeId: string;
  };
  meetingRoom: {
    id: string;
    name: string;
    floor: number;
    qrCodeSlug: string;
  };
}

export interface LockerCompartment {
  id: string;
  lockerId: string;
  compartmentNumber: number;
  status: CompartmentStatusType;
  assetId: string | null;
  solenoidLocked: boolean;
  doorPhysicalOpen: boolean;
  irSensorBreakBeam: boolean;
  chargingConnected: boolean;
  asset: (AssetItem & { sku: HardwareSKU }) | null;
  tickets: LockerTicketSummary[];
}

export interface SmartLocker {
  id: string;
  name: string;
  floor: number;
  locationNote: string;
  onlineStatus: boolean;
  lastHeartbeatAt?: string | null;
  temperatureC?: number | null;
  compartments: LockerCompartment[];
}

export interface DiagnoseReserveResult {
  ticketId: string;
  itsmTicketNumber: string;
  locker: {
    id: string;
    name: string;
    floor: number;
    compartmentNumber: number;
  };
  allocatedAsset: {
    id: string;
    serialNumber: string;
    skuName: string;
    usbVendorId: string;
    usbProductId: string;
  };
  accessPin: string;
  expiresAt: string;
}

export interface LandedCostResponse {
  cifAmountPaise: number;
  assessableValuePaise: number;
  bcdPaise: number;
  swsPaise: number;
  igstPaise: number;
  totalDutiesPaise: number;
  totalLandedCostPaise: number;
  effectiveCostNetOfItcPaise: number;
  procurementMode: "DIRECT_IMPORT" | "DOMESTIC_WHOLESALE";
  effectiveDutyRatePercent: number;
  formatted: {
    cifINR: string;
    assessableValueINR: string;
    bcdINR: string;
    swsINR: string;
    igstINR: string;
    totalDutiesINR: string;
    totalLandedCostINR: string;
    netCostAfterItcINR: string;
  };
  rates: {
    bcdPercent: string;
    swsPercent: string;
    igstPercent: string;
  };
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  skuId: string;
  quantity: number;
  unitPricePaise: number;
  sku?: HardwareSKU;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  procurementMode: string;
  vendorName: string;
  totalAmountPaise: number;
  landedDutyPaise: number;
  status: string;
  createdAt: string;
  items: PurchaseOrderItem[];
}

export interface FinOpsTransaction {
  id: string;
  purchaseOrderId: string | null;
  provider: string;
  mccCode: string;
  policyResult: string;
  erpSyncTarget: string;
  erpSyncStatus: string;
  vendorName: string;
  amountPaise: number;
  gstInvoiceNumber: string;
  itemsSummary: string;
  createdAt: string;
  purchaseOrder?: PurchaseOrder | null;
}

export interface AnomalyAlert {
  roomId: string;
  roomName: string;
  floor: number;
  unreturnedCount14Days: number;
  status: string;
  recommendation: string;
  urgency: string;
}

export interface FloorMetric {
  lockerId: string;
  lockerName: string;
  floor: number;
  temperatureC: number | null;
  totalBays: number;
  occupiedBays: number;
  checkedOutBays: number;
  quarantinedBays: number;
  occupancyRatePercent: number;
}

export interface ConsumptionTrendPoint {
  month: string;
  wholesaleINR: number;
  retailAvoidedINR: number;
  savingsINR: number;
}

export interface WebhookEvent {
  id: string;
  direction: string;
  source: string;
  externalEventId: string | null;
  payload: string;
  signatureValid: boolean;
  latencyMs: number;
  status: string;
  replayOfId: string | null;
  createdAt: string;
}

