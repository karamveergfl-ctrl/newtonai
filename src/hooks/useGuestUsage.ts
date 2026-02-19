import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "newton_guest_trial";
const MAX_USES = 2;
const EXPIRY_DAYS = 7;

interface GuestTrialData {
  id: string;
  count: number;
  expiry: number;
}

function generateId(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getStoredData(): GuestTrialData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: GuestTrialData = JSON.parse(raw);
    // Check expiry
    if (Date.now() > data.expiry) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveData(data: GuestTrialData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useGuestUsage() {
  const [data, setData] = useState<GuestTrialData | null>(() => getStoredData());

  const guestUsageCount = data?.count ?? 0;
  const guestLimitReached = guestUsageCount >= MAX_USES;
  const guestSessionId = data?.id ?? null;

  const incrementGuestUsage = useCallback(() => {
    const current = getStoredData();
    const updated: GuestTrialData = current
      ? { ...current, count: current.count + 1 }
      : {
          id: generateId(),
          count: 1,
          expiry: Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        };
    saveData(updated);
    setData(updated);
  }, []);

  const clearGuestData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setData(null);
  }, []);

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setData(getStoredData());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return {
    guestUsageCount,
    guestLimitReached,
    guestSessionId,
    maxUses: MAX_USES,
    incrementGuestUsage,
    clearGuestData,
  };
}
