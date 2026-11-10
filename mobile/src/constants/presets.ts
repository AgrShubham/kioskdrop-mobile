export interface ApiPreset {
  id: string;
  label: string;
  subtitle: string;
  url: string;
}

export const API_URL_PRESETS: ApiPreset[] = [
  {
    id: "android-emulator",
    label: "Android Emulator",
    subtitle: "Host loopback via AVD bridge",
    url: "http://10.0.2.2:3000",
  },
  {
    id: "localhost",
    label: "iOS / Localhost",
    subtitle: "Simulator or local web",
    url: "http://localhost:3000",
  },
  {
    id: "production-demo",
    label: "Production Demo",
    subtitle: "KioskDrop Vercel cloud",
    url: "https://kioskdrop-enterprise.vercel.app",
  },
];

export interface HsnOption {
  code: string;
  label: string;
  dutySummary: string;
}

export const HSN_CODE_PRESETS: HsnOption[] = [
  {
    code: "85437099",
    label: "Wireless / Video Processors",
    dutySummary: "20% BCD · 10% SWS · 18% IGST",
  },
  {
    code: "85182210",
    label: "Acoustic Microphones & Kits",
    dutySummary: "15% BCD · 10% SWS · 18% IGST",
  },
  {
    code: "85444299",
    label: "High-Speed AV / USB-C Cables",
    dutySummary: "15% BCD · 10% SWS · 18% IGST",
  },
  {
    code: "85181000",
    label: "Directional Boundary Mics",
    dutySummary: "15% BCD · 10% SWS · 18% IGST",
  },
];

export const BADUSB_SIMULATION_VECTOR = {
  foreignVendorId: "0x16C0",
  foreignProductId: "0x05DF",
  simulatedAttackVector: "BadUSB Keystroke Injection payload detected",
  counterfeitSerial: "SN-FAKE-USB-999",
} as const;

