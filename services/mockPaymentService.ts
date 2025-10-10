// services/mockPaymentService.ts
// Simple mock payment storage for donor-side payments.
// Stores using AsyncStorage when available and falls back to in-memory store.

export interface MockPaymentRecord {
  id: string;
  donationId: string;
  donorId?: string;
  amount: number;
  status: 'succeeded' | 'failed' | 'pending';
  createdAt: string;
  details?: Record<string, any>;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@nutrilink:mockPayments';

let store: MockPaymentRecord[] = [];

// try to hydrate from AsyncStorage at module load (best-effort)
AsyncStorage.getItem(STORAGE_KEY)
  .then((raw) => {
    if (raw) {
      try {
        store = JSON.parse(raw) as MockPaymentRecord[];
      } catch (e) {
        console.warn('[mockPaymentService] failed to parse persisted mock payments', e);
        store = [];
      }
    }
  })
  .catch(() => {
    // ignore - keep in-memory
    store = [];
  });

export const savePaymentRecord = async (record: Omit<MockPaymentRecord, 'id' | 'createdAt'>) => {
  const rec: MockPaymentRecord = {
    id: `mock_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...record,
  } as MockPaymentRecord;
  store.push(rec);
  // persist
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('[mockPaymentService] failed to persist payment record', e);
  }
  // Log for debugging / later backend replacement
  console.log('[mockPaymentService] saved payment record', rec);
  return rec;
};

export const getAllMockPayments = async (): Promise<MockPaymentRecord[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockPaymentRecord[];
      return parsed.slice().reverse();
    }
  } catch (e) {
    // fallback to memory
  }
  return store.slice().reverse();
};

export const clearMockPayments = async () => {
  store.length = 0;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[mockPaymentService] failed to clear persisted payments', e);
  }
};

export default {
  savePaymentRecord,
  getAllMockPayments,
  clearMockPayments,
};
