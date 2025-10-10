import { ref, get, set, push, update } from 'firebase/database';
import { database } from '@/config/firebase';
import { PublishedDonation, DonationFulfillment } from '@/types';

export const createPublishedDonation = async (
  donationData: Omit<PublishedDonation, 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> => {
  console.log('createPublishedDonation called with data:', donationData);

  try {
    const donationsRef = ref(database, 'publishedDonations');
    console.log('Database reference created');

    const newDonationRef = push(donationsRef);
    console.log('Push reference created with key:', newDonationRef.key);

    const donation: PublishedDonation = {
      ...donationData,
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Final donation object:', donation);

    await set(newDonationRef, donation);
    console.log('Data saved to Firebase successfully');

    return newDonationRef.key!;
  } catch (error) {
    console.error('Error in createPublishedDonation:', error);
    throw error;
  }
};

export const getPublishedDonationById = async (donationId: string): Promise<PublishedDonation | null> => {
  const donationRef = ref(database, `publishedDonations/${donationId}`);
  const snapshot = await get(donationRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as PublishedDonation;
};

export const getAllPublishedDonations = async (): Promise<Record<string, PublishedDonation>> => {
  const donationsRef = ref(database, 'publishedDonations');
  const snapshot = await get(donationsRef);

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val() as Record<string, PublishedDonation>;
};

export const getPublishedDonationsByDonorId = async (donorId: string): Promise<Record<string, PublishedDonation>> => {
  const donations = await getAllPublishedDonations();
  const donorDonations: Record<string, PublishedDonation> = {};

  Object.entries(donations).forEach(([id, donation]) => {
    if (donation.donorId === donorId) {
      donorDonations[id] = donation;
    }
  });

  return donorDonations;
};

export const getAvailablePublishedDonations = async (): Promise<Record<string, PublishedDonation>> => {
  const donations = await getAllPublishedDonations();
  const availableDonations: Record<string, PublishedDonation> = {};

  Object.entries(donations).forEach(([id, donation]) => {
    if (donation.status === 'available') {
      availableDonations[id] = donation;
    }
  });

  return availableDonations;
};

export const updatePublishedDonation = async (
  donationId: string,
  updates: Partial<PublishedDonation>
): Promise<void> => {
  const donationRef = ref(database, `publishedDonations/${donationId}`);
  await update(donationRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
};

export const createDonationFulfillment = async (
  fulfillmentData: Omit<DonationFulfillment, 'createdAt' | 'status'>
): Promise<string> => {
  const fulfillmentsRef = ref(database, 'donationFulfillments');
  const newFulfillmentRef = push(fulfillmentsRef);

  const fulfillment: DonationFulfillment = {
    ...fulfillmentData,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await set(newFulfillmentRef, fulfillment);
  return newFulfillmentRef.key!;
};

export const getAllDonationFulfillments = async (): Promise<Record<string, DonationFulfillment>> => {
  const fulfillmentsRef = ref(database, 'donationFulfillments');
  const snapshot = await get(fulfillmentsRef);

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val() as Record<string, DonationFulfillment>;
};

export const getFulfillmentsByDonorId = async (donorId: string): Promise<Record<string, DonationFulfillment>> => {
  const fulfillments = await getAllDonationFulfillments();
  const donorFulfillments: Record<string, DonationFulfillment> = {};

  Object.entries(fulfillments).forEach(([id, fulfillment]) => {
    if (fulfillment.donorId === donorId) {
      donorFulfillments[id] = fulfillment;
    }
  });

  return donorFulfillments;
};

export const getFulfillmentsByRequestId = async (requestId: string): Promise<Record<string, DonationFulfillment>> => {
  const fulfillments = await getAllDonationFulfillments();
  const requestFulfillments: Record<string, DonationFulfillment> = {};

  Object.entries(fulfillments).forEach(([id, fulfillment]) => {
    if (fulfillment.donationRequestId === requestId) {
      requestFulfillments[id] = fulfillment;
    }
  });

  return requestFulfillments;
};

export const updateDonationFulfillment = async (
  fulfillmentId: string,
  updates: Partial<DonationFulfillment>
): Promise<void> => {
  const fulfillmentRef = ref(database, `donationFulfillments/${fulfillmentId}`);
  await update(fulfillmentRef, updates);
};

export const acceptDonationRequest = async (
  fulfillmentId: string,
  publishedDonationId: string
): Promise<void> => {
  await updateDonationFulfillment(fulfillmentId, {
    status: 'accepted',
  });

  await updatePublishedDonation(publishedDonationId, {
    status: 'reserved',
  });
};

export const completeDonationFulfillment = async (
  fulfillmentId: string,
  publishedDonationId: string
): Promise<void> => {
  await updateDonationFulfillment(fulfillmentId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  });

  await updatePublishedDonation(publishedDonationId, {
    status: 'fulfilled',
  });
};

export const deletePublishedDonation = async (donationId: string): Promise<void> => {
  const donationRef = ref(database, `publishedDonations/${donationId}`);
  await set(donationRef, null);
};

export const deleteDonationFulfillment = async (fulfillmentId: string): Promise<void> => {
  const fulfillmentRef = ref(database, `donationFulfillments/${fulfillmentId}`);
  await set(fulfillmentRef, null);
};
