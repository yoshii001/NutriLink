import { ref, get, set, push, update } from 'firebase/database';
import { database } from '@/config/firebase';
import { DonationRequest } from '@/types';

export const createDonationRequest = async (requestData: Omit<DonationRequest, 'createdAt' | 'fulfilledAmount'>): Promise<string> => {
  const requestsRef = ref(database, 'donationRequests');
  const newRequestRef = push(requestsRef);

  const request: DonationRequest = {
    ...requestData,
    createdAt: new Date().toISOString(),
    fulfilledAmount: 0,
  };

  await set(newRequestRef, request);
  return newRequestRef.key!;
};

export const getDonationRequestById = async (requestId: string): Promise<DonationRequest | null> => {
  const requestRef = ref(database, `donationRequests/${requestId}`);
  const snapshot = await get(requestRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as DonationRequest;
};

export const getAllDonationRequests = async (): Promise<Record<string, DonationRequest>> => {
  const requestsRef = ref(database, 'donationRequests');
  const snapshot = await get(requestsRef);

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val() as Record<string, DonationRequest>;
};

export const getDonationRequestsBySchoolId = async (schoolId: string): Promise<Record<string, DonationRequest>> => {
  const requests = await getAllDonationRequests();
  const schoolRequests: Record<string, DonationRequest> = {};

  Object.entries(requests).forEach(([id, request]) => {
    if (request.schoolId === schoolId) {
      schoolRequests[id] = request;
    }
  });

  return schoolRequests;
};

export const getActiveDonationRequests = async (): Promise<Record<string, DonationRequest>> => {
  const requests = await getAllDonationRequests();
  const activeRequests: Record<string, DonationRequest> = {};

  Object.entries(requests).forEach(([id, request]) => {
    if (request.status === 'active') {
      activeRequests[id] = request;
    }
  });

  return activeRequests;
};

export const updateDonationRequest = async (requestId: string, updates: Partial<DonationRequest>): Promise<void> => {
  const requestRef = ref(database, `donationRequests/${requestId}`);
  await update(requestRef, updates);
};

export const updateFulfilledAmount = async (requestId: string, amount: number): Promise<void> => {
  const request = await getDonationRequestById(requestId);

  if (!request) {
    throw new Error('Donation request not found');
  }

  const newFulfilledAmount = request.fulfilledAmount + amount;
  const updates: Partial<DonationRequest> = {
    fulfilledAmount: newFulfilledAmount,
  };

  if (newFulfilledAmount >= request.requestedAmount) {
    updates.status = 'fulfilled';
  }

  await updateDonationRequest(requestId, updates);
};

export const cancelDonationRequest = async (requestId: string): Promise<void> => {
  await updateDonationRequest(requestId, { status: 'cancelled' });
};
