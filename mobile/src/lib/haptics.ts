import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

async function safeInvoke(fn: () => Promise<void>): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await fn();
  } catch {
    // Ignore unsupported haptic motor errors in simulators/older devices
  }
}

export const haptics = {
  tap(): Promise<void> {
    return safeInvoke(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    );
  },
  selection(): Promise<void> {
    return safeInvoke(() => Haptics.selectionAsync());
  },
  success(): Promise<void> {
    return safeInvoke(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    );
  },
  warning(): Promise<void> {
    return safeInvoke(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    );
  },
  error(): Promise<void> {
    return safeInvoke(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    );
  },
};

