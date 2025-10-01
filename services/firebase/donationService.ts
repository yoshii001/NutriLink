import { ref, get, set, push, update } from 'firebase/database';
import { database } from '@/config/firebase';
import { Donation } from '@/types';

export const getAllDonations = async (): Promise<Record<string, Donation>> => {
  const donationsRef = ref(database, 'donations');
  const snapshot = await get(donationsRef);

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val() as Record<string, Donation>;
};

export const getDonation = async (donationId: string): Promise<Donation | null> => {
  const donationRef = ref(database, `donations/${donationId}`);
  const snapshot = await get(donationRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as Donation;
};

export const addDonation = async (donation: Donation): Promise<string> => {
  const donationsRef = ref(database, 'donations');
  const newDonationRef = push(donationsRef);
  await set(newDonationRef, donation);
  return newDonationRef.key!;
};

export const updateDonation = async (donationId: string, updates: Partial<Donation>): Promise<void> => {
  const donationRef = ref(database, `donations/${donationId}`);
  await update(donationRef, updates);
};

export const getDonationsBySchoolId = async (schoolId: string): Promise<Record<string, Donation>> => {
  const donations = await getAllDonations();
  const schoolDonations: Record<string, Donation> = {};

  Object.entries(donations).forEach(([id, donation]) => {
    if (donation.schoolId === schoolId) {
      schoolDonations[id] = donation;
    }
  });

  return schoolDonations;
};

export const getDonationsByMealPlanId = async (mealPlanId: string): Promise<Record<string, Donation>> => {
  const donations = await getAllDonations();
  const mealPlanDonations: Record<string, Donation> = {};

  Object.entries(donations).forEach(([id, donation]) => {
    if (donation.mealPlanId === mealPlanId) {
      mealPlanDonations[id] = donation;
    }
  });

  return mealPlanDonations;
};

export const getDonationsByDonorId = async (donorId: string): Promise<Record<string, Donation>> => {
  const donations = await getAllDonations();
  const donorDonations: Record<string, Donation> = {};

  Object.entries(donations).forEach(([id, donation]) => {
    if (donation.donorId === donorId) {
      donorDonations[id] = donation;
    }
  });

  return donorDonations;
};