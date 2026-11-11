import { z } from "zod";

export const userRoleSchema = z.enum(["EMPLOYEE", "IT_ADMIN", "FINOPS_AUDITOR"]);

export const compartmentStatusSchema = z.enum([
  "EMPTY",
  "STOCKED_AVAILABLE",
  "RESERVED_FOR_PICKUP",
  "DOOR_OPEN_AWAITING_REMOVAL",
  "CHECKED_OUT",
  "MAINTENANCE_QUARANTINE",
]);

export const userSessionSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  department: z.string(),
  role: userRoleSchema,
  rfidBadgeId: z.string(),
});

export const directoryUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  department: z.string(),
  role: userRoleSchema,
  rfidBadgeId: z.string(),
});

export const sessionCurrentResponseSchema = z.object({
  success: z.literal(true),
  session: userSessionSchema,
  availableUsers: z.array(directoryUserSchema),
});

export const switchRoleResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  session: userSessionSchema,
  token: z.string().min(1),
  requestId: z.string().optional(),
});

export const meetingRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  floor: z.number(),
  building: z.string(),
  displayType: z.string(),
  roomSystem: z.string(),
  qrCodeSlug: z.string(),
});

export const roomsResponseSchema = z.object({
  success: z.literal(true),
  rooms: z.array(meetingRoomSchema),
});

export const tariffRateSchema = z.object({
  id: z.string(),
  hsnCode: z.string(),
  description: z.string(),
  bcdBp: z.number(),
  swsBp: z.number(),
  igstBp: z.number(),
  effectiveFrom: z.string().optional(),
});

export const hardwareSkuSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
  modelNumber: z.string(),
  category: z.string(),
  wholesalePricePaise: z.number(),
  retailPricePaise: z.number(),
  reorderThreshold: z.number(),
  reorderQuantity: z.number(),
  tariffRateId: z.string(),
  tariffRate: tariffRateSchema.optional(),
  dpAltMode: z.boolean(),
  powerDeliveryWatts: z.number(),
  hdcp22Compliant: z.boolean(),
  wirelessBand: z.string().nullish(),
  encryptionSpec: z.string().nullish(),
  wpcEtaCertNumber: z.string().nullish(),
  bisCrsNumber: z.string().nullish(),
});

export const assetItemSchema = z.object({
  id: z.string(),
  skuId: z.string(),
  serialNumber: z.string(),
  usbVendorId: z.string(),
  usbProductId: z.string(),
  hidWhitelisted: z.boolean(),
  pkiCertStatus: z.string(),
  condition: z.string(),
  availability: z.string(),
  sku: hardwareSkuSchema.optional(),
  compartment: z
    .object({
      id: z.string(),
      lockerId: z.string(),
      compartmentNumber: z.number(),
      status: compartmentStatusSchema,
      locker: z
        .object({
          id: z.string(),
          name: z.string(),
          floor: z.number(),
          locationNote: z.string(),
        })
        .optional(),
    })
    .nullish(),
});

export const lockerTicketSummarySchema = z.object({
  id: z.string(),
  itsmExternalId: z.string(),
  status: z.string(),
  expiresAt: z.string(),
  reportedSymptom: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    rfidBadgeId: z.string(),
  }),
  meetingRoom: z.object({
    id: z.string(),
    name: z.string(),
    floor: z.number(),
    qrCodeSlug: z.string(),
  }),
});

export const lockerCompartmentSchema = z.object({
  id: z.string(),
  lockerId: z.string(),
  compartmentNumber: z.number(),
  status: compartmentStatusSchema,
  assetId: z.string().nullable(),
  solenoidLocked: z.boolean(),
  doorPhysicalOpen: z.boolean(),
  irSensorBreakBeam: z.boolean(),
  chargingConnected: z.boolean(),
  asset: assetItemSchema.extend({ sku: hardwareSkuSchema }).nullable(),
  tickets: z.array(lockerTicketSummarySchema),
});

export const smartLockerSchema = z.object({
  id: z.string(),
  name: z.string(),
  floor: z.number(),
  locationNote: z.string(),
  onlineStatus: z.boolean(),
  lastHeartbeatAt: z.string().nullish(),
  temperatureC: z.number().nullish(),
  compartments: z.array(lockerCompartmentSchema),
});

export const lockersResponseSchema = z.object({
  success: z.literal(true),
  lockers: z.array(smartLockerSchema),
});

export const diagnoseReserveResponseSchema = z.object({
  success: z.literal(true),
  ticketId: z.string(),
  itsmTicketNumber: z.string(),
  locker: z.object({
    id: z.string(),
    name: z.string(),
    floor: z.number(),
    compartmentNumber: z.number(),
  }),
  allocatedAsset: z.object({
    id: z.string(),
    serialNumber: z.string(),
    skuName: z.string(),
    usbVendorId: z.string(),
    usbProductId: z.string(),
  }),
  accessPin: z.string(),
  expiresAt: z.string(),
  requestId: z.string().optional(),
});

export const kioskUnlockResponseSchema = z.object({
  success: z.literal(true),
  unlockedCompartment: z.number(),
  solenoidReleased: z.boolean(),
  assetSerialNumber: z.string(),
  skuName: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
});

export const kioskRemoveAssetResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  requestId: z.string().optional(),
});

export const kioskReturnAssetResponseSchema = z.object({
  success: z.literal(true),
  ticketClosed: z.string(),
  compartmentStatus: z.enum(["STOCKED_AVAILABLE", "MAINTENANCE_QUARANTINE"]),
  auditEventId: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
});

export const kioskForeignDeviceResponseSchema = z.object({
  success: z.literal(true),
  alarmTriggered: z.boolean(),
  compartmentStatus: compartmentStatusSchema,
  incidentCode: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
});

export const complianceGetResponseSchema = z.object({
  success: z.literal(true),
  assets: z.array(
    assetItemSchema.extend({
      sku: hardwareSkuSchema.extend({ tariffRate: tariffRateSchema }),
    })
  ),
  tariffRates: z.array(
    tariffRateSchema.extend({
      skus: z.array(hardwareSkuSchema).optional(),
    })
  ),
  requestId: z.string().optional(),
});

export const complianceToggleResponseSchema = z.object({
  success: z.literal(true),
  updated: assetItemSchema,
  message: z.string(),
  requestId: z.string().optional(),
});

export const landedCostResponseSchema = z.object({
  success: z.literal(true),
  cifAmountPaise: z.number(),
  assessableValuePaise: z.number(),
  bcdPaise: z.number(),
  swsPaise: z.number(),
  igstPaise: z.number(),
  totalDutiesPaise: z.number(),
  totalLandedCostPaise: z.number(),
  effectiveCostNetOfItcPaise: z.number(),
  procurementMode: z.enum(["DIRECT_IMPORT", "DOMESTIC_WHOLESALE"]),
  effectiveDutyRatePercent: z.number(),
  formatted: z.object({
    cifINR: z.string(),
    assessableValueINR: z.string(),
    bcdINR: z.string(),
    swsINR: z.string(),
    igstINR: z.string(),
    totalDutiesINR: z.string(),
    totalLandedCostINR: z.string(),
    netCostAfterItcINR: z.string(),
  }),
  rates: z.object({
    bcdPercent: z.string(),
    swsPercent: z.string(),
    igstPercent: z.string(),
  }),
  requestId: z.string().optional(),
});

export const purchaseOrderItemSchema = z.object({
  id: z.string(),
  purchaseOrderId: z.string(),
  skuId: z.string(),
  quantity: z.number(),
  unitPricePaise: z.number(),
  sku: hardwareSkuSchema.optional(),
});

export const purchaseOrderSchema = z.object({
  id: z.string(),
  poNumber: z.string(),
  procurementMode: z.string(),
  vendorName: z.string(),
  totalAmountPaise: z.number(),
  landedDutyPaise: z.number(),
  status: z.string(),
  createdAt: z.string(),
  items: z.array(purchaseOrderItemSchema).optional().default([]),
});

export const finopsTransactionSchema = z.object({
  id: z.string(),
  purchaseOrderId: z.string().nullable(),
  provider: z.string(),
  mccCode: z.string(),
  policyResult: z.string(),
  erpSyncTarget: z.string(),
  erpSyncStatus: z.string(),
  vendorName: z.string(),
  amountPaise: z.number(),
  gstInvoiceNumber: z.string(),
  itemsSummary: z.string(),
  createdAt: z.string(),
  purchaseOrder: purchaseOrderSchema.nullish(),
});

export const finopsGetResponseSchema = z.object({
  success: z.literal(true),
  transactions: z.array(finopsTransactionSchema),
  purchaseOrders: z.array(purchaseOrderSchema),
  skus: z.array(hardwareSkuSchema),
  totalSavingsPaise: z.number(),
  requestId: z.string().optional(),
});

export const finopsCreateResponseSchema = z.object({
  success: z.literal(true),
  purchaseOrder: purchaseOrderSchema,
  transaction: finopsTransactionSchema,
  dutyBreakdown: z.object({
    cifAmountPaise: z.number(),
    assessableValuePaise: z.number(),
    bcdPaise: z.number(),
    swsPaise: z.number(),
    igstPaise: z.number(),
    totalDutiesPaise: z.number(),
    totalLandedCostPaise: z.number(),
    effectiveCostNetOfItcPaise: z.number(),
    procurementMode: z.enum(["DIRECT_IMPORT", "DOMESTIC_WHOLESALE"]),
    effectiveDutyRatePercent: z.number(),
  }),
  message: z.string(),
  requestId: z.string().optional(),
});

export const receptionScanResponseSchema = z.object({
  success: z.literal(true),
  asset: assetItemSchema,
  compartmentStatus: compartmentStatusSchema,
  message: z.string(),
  requestId: z.string().optional(),
});

export const analyticsResponseSchema = z.object({
  success: z.literal(true),
  anomalyAlerts: z.array(
    z.object({
      roomId: z.string(),
      roomName: z.string(),
      floor: z.number(),
      unreturnedCount14Days: z.number(),
      status: z.string(),
      recommendation: z.string(),
      urgency: z.string(),
    })
  ),
  floorMetrics: z.array(
    z.object({
      lockerId: z.string(),
      lockerName: z.string(),
      floor: z.number(),
      temperatureC: z.number().nullable(),
      totalBays: z.number(),
      occupiedBays: z.number(),
      checkedOutBays: z.number(),
      quarantinedBays: z.number(),
      occupancyRatePercent: z.number(),
    })
  ),
  financialSummary: z.object({
    totalIncidentsResolved: z.number(),
    totalRetailAvoidedPaise: z.number(),
    totalWholesalePaise: z.number(),
    netSavingsPaise: z.number(),
  }),
  consumptionTrends: z.array(
    z.object({
      month: z.string(),
      wholesaleINR: z.number(),
      retailAvoidedINR: z.number(),
      savingsINR: z.number(),
    })
  ),
  requestId: z.string().optional(),
});

export const webhookEventSchema = z.object({
  id: z.string(),
  direction: z.string(),
  source: z.string(),
  externalEventId: z.string().nullable(),
  payload: z.string(),
  signatureValid: z.boolean(),
  latencyMs: z.number(),
  status: z.string(),
  replayOfId: z.string().nullable(),
  createdAt: z.string(),
});

export const webhooksGetResponseSchema = z.object({
  success: z.literal(true),
  events: z.array(webhookEventSchema),
  requestId: z.string().optional(),
});

export const webhookReplayResponseSchema = z.object({
  success: z.literal(true),
  replayed: webhookEventSchema,
  message: z.string(),
  requestId: z.string().optional(),
});

export const inboundWebhookTriggerResponseSchema = z.object({
  success: z.literal(true),
  received: z.boolean(),
  eventId: z.string(),
  externalEventId: z.string(),
  status: z.string(),
  requestId: z.string().optional(),
});

export const telemetryEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    "LOCKER_RESERVED",
    "DOOR_UNLOCKED",
    "ASSET_REMOVED",
    "ASSET_RETURNED",
    "SECURITY_MISMATCH_ALARM",
    "TICKET_EXPIRED",
    "TICKET_OVERDUE",
    "INVENTORY_RESTOCKED",
  ]),
  version: z.string(),
  ts: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

export const apiErrorPayloadSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  requestId: z.string().optional(),
});

