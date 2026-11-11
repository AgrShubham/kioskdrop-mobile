export interface SymptomOption {
  code:
    | "SYMPTOM_NO_DISPLAY_BYOD"
    | "SYMPTOM_VIDEO_WALL_BLACKOUT"
    | "SYMPTOM_AV_DESYNC"
    | "SYMPTOM_HYBRID_PRESENTATION_CONTROL"
    | "SYMPTOM_AUDIO_ECHO_HOLLOW";
  title: string;
  shortLabel: string;
  description: string;
  defaultSkuName: string;
  fallbackSkuName?: string;
  portDamagedOverrideSkuName?: string;
  urgency: "P1_CRITICAL" | "P2_HIGH" | "P3_STANDARD";
  supportsPortDamagedToggle?: boolean;
}

export const DIAGNOSTIC_SYMPTOMS: SymptomOption[] = [
  {
    code: "SYMPTOM_NO_DISPLAY_BYOD",
    title: "No Display on Laptop (USB-C / HDMI)",
    shortLabel: "BYOD No Display",
    description:
      "Laptop screen fails to project onto conference display or power delivery is missing.",
    defaultSkuName: "Anker USB-C 60W PD Display Hub (A8338-PRO)",
    fallbackSkuName: "Barco ClickShare Wireless 4K HDMI Kit",
    portDamagedOverrideSkuName: "Barco CS-400W 4K Wireless HDMI Kit",
    urgency: "P1_CRITICAL",
    supportsPortDamagedToggle: true,
  },
  {
    code: "SYMPTOM_VIDEO_WALL_BLACKOUT",
    title: "4K Video Wall Blackout / HDCP Error",
    shortLabel: "HDCP Blackout",
    description:
      "Main LED wall or projector shows intermittent blackouts or cryptographic handshake errors.",
    defaultSkuName: "Kramer VP-427A HDCP 2.2 Video Scaler",
    fallbackSkuName: "Belkin 48Gbps HDMI 2.1 Cable",
    urgency: "P1_CRITICAL",
  },
  {
    code: "SYMPTOM_AV_DESYNC",
    title: "Audio / Video Lip-Sync Desync",
    shortLabel: "AV Desync",
    description:
      "Speech lags behind video feed or scaler buffer introduces frame jitter during calls.",
    defaultSkuName: "Club3D Direct DisplayPort 1.4 Cable",
    fallbackSkuName: "Belkin 48Gbps HDMI 2.1 Cable",
    urgency: "P2_HIGH",
  },
  {
    code: "SYMPTOM_HYBRID_PRESENTATION_CONTROL",
    title: "Hybrid Pointer / Clicker Unavailable",
    shortLabel: "Pointer & Clicker",
    description:
      "Remote Teams/Zoom attendees cannot see digital pointer highlights or slide transitions.",
    defaultSkuName: "Logitech Spotlight BLE Presentation Remote",
    urgency: "P3_STANDARD",
  },
  {
    code: "SYMPTOM_AUDIO_ECHO_HOLLOW",
    title: "Room Echo / Hollow Mic Audio",
    shortLabel: "Acoustic Echo",
    description:
      "Far-end conference participants hear hollow reflections or clipped laptop mic pickup.",
    defaultSkuName: "Shure CVB-B/O Boundary Presentation Mic Kit",
    urgency: "P2_HIGH",
  },
];

