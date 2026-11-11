import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const SESSION_TOKEN_KEY = "kioskdrop_session_token";
const WEB_TOKEN_FALLBACK_KEY = "@kioskdrop/web_session_token";

export async function getStoredSessionToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return await AsyncStorage.getItem(WEB_TOKEN_FALLBACK_KEY);
    }
    return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredSessionToken(token: string): Promise<void> {
  if (!token) return;
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(WEB_TOKEN_FALLBACK_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function clearStoredSessionToken(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(WEB_TOKEN_FALLBACK_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  } catch {
    // Ignore storage cleanup errors
  }
}

export const storage = {
  getItem: AsyncStorage.getItem,
  setItem: AsyncStorage.setItem,
  removeItem: AsyncStorage.removeItem,
};

