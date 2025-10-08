const OFFLINE_PASSWORD_KEY = "belemplay-offline-password";

export const DEFAULT_ADMIN_PASSWORD = "belem123";

function isBrowserEnvironment() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getStoredAdminPassword(): string {
  if (!isBrowserEnvironment()) {
    return DEFAULT_ADMIN_PASSWORD;
  }

  try {
    return localStorage.getItem(OFFLINE_PASSWORD_KEY) ?? DEFAULT_ADMIN_PASSWORD;
  } catch (error) {
    console.warn("Não foi possível ler a senha local:", error);
    return DEFAULT_ADMIN_PASSWORD;
  }
}

export function setStoredAdminPassword(newPassword: string) {
  if (!isBrowserEnvironment()) {
    return;
  }

  try {
    localStorage.setItem(OFFLINE_PASSWORD_KEY, newPassword);
  } catch (error) {
    console.warn("Não foi possível salvar a senha local:", error);
    throw error;
  }
}

export function isValidAdminPassword(candidate: string): boolean {
  return candidate === getStoredAdminPassword();
}
