import { ref, get, set, update } from 'firebase/database';
import { database } from '@/config/firebase';
import { Feedback } from '@/types';

export const getAllFeedback = async (): Promise<Record<string, Feedback>> => {
  const feedbackRef = ref(database, 'feedback');
  const snapshot = await get(feedbackRef);

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val() as Record<string, Feedback>;
};

export const getFeedbackByDate = async (date: string): Promise<Feedback | null> => {
  const feedbackRef = ref(database, `feedback/${date}`);
  const snapshot = await get(feedbackRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as Feedback;
};

export const submitFeedback = async (date: string, feedback: Feedback): Promise<void> => {
  const feedbackRef = ref(database, `feedback/${date}`);
  await set(feedbackRef, feedback);
};

export const updateFeedbackStatus = async (date: string, status: 'submitted' | 'reviewed'): Promise<void> => {
  const feedbackRef = ref(database, `feedback/${date}`);
  await update(feedbackRef, { status });
};