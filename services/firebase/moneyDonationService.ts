import { ref, push, set, get, update } from 'firebase/database';
import { database } from '@/config/firebase';
import { MoneyDonationRecord } from '@/types';

/**
 * Money Donation Service
 * - Stores monetary donations in a separate `moneyDonations` collection.
 * - Keeps money donation records independent from `publishedDonations` to meet
 *   the requirement of separate DB areas for different donation types.
 */

export const createMoneyDonation = async (
  record: Omit<MoneyDonationRecord, 'createdAt'>
): Promise<string> => {
  const refNode = ref(database, 'moneyDonations');
  const newRef = push(refNode);

  const toSave: MoneyDonationRecord = {
    ...record,
    createdAt: new Date().toISOString(),
  };

  await set(newRef, toSave);
  return newRef.key!;
};

export const getMoneyDonationById = async (id: string): Promise<MoneyDonationRecord | null> => {
  const snapshot = await get(ref(database, `moneyDonations/${id}`));
  if (!snapshot.exists()) return null;
  return snapshot.val() as MoneyDonationRecord;
};

export const getAllMoneyDonations = async (): Promise<Record<string, MoneyDonationRecord>> => {
  const snapshot = await get(ref(database, 'moneyDonations'));
  if (!snapshot.exists()) return {};
  return snapshot.val() as Record<string, MoneyDonationRecord>;
};

export const deleteMoneyDonation = async (id: string): Promise<void> => {
  await set(ref(database, `moneyDonations/${id}`), null);
};

export const updateMoneyDonation = async (id: string, updates: Partial<MoneyDonationRecord>): Promise<void> => {
  const donationRef = ref(database, `moneyDonations/${id}`);
  await update(donationRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
};
