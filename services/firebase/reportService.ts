import { ref, get, set } from 'firebase/database';
import { database } from '@/config/firebase';
import { Report } from '@/types';

export const getAllReports = async (): Promise<Record<string, Report>> => {
  const reportsRef = ref(database, 'reports');
  const snapshot = await get(reportsRef);

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val() as Record<string, Report>;
};

export const getReport = async (reportId: string): Promise<Report | null> => {
  const reportRef = ref(database, `reports/${reportId}`);
  const snapshot = await get(reportRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as Report;
};

export const saveReport = async (reportId: string, report: Report): Promise<void> => {
  const reportRef = ref(database, `reports/${reportId}`);
  await set(reportRef, report);
};