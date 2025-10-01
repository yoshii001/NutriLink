import { ref, get, set, push, update } from 'firebase/database';
import { database } from '@/config/firebase';
import { School } from '@/types';

export const requestSchoolAddition = async (schoolData: Omit<School, 'createdAt' | 'status'>): Promise<string> => {
  const schoolsRef = ref(database, 'schools');
  const newSchoolRef = push(schoolsRef);

  const school: School = {
    ...schoolData,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await set(newSchoolRef, school);
  return newSchoolRef.key!;
};

export const getSchoolById = async (schoolId: string): Promise<School | null> => {
  const schoolRef = ref(database, `schools/${schoolId}`);
  const snapshot = await get(schoolRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as School;
};

export const getAllSchools = async (): Promise<Record<string, School>> => {
  const schoolsRef = ref(database, 'schools');
  const snapshot = await get(schoolsRef);

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val() as Record<string, School>;
};

export const getPendingSchools = async (): Promise<Record<string, School>> => {
  const schools = await getAllSchools();
  const pendingSchools: Record<string, School> = {};

  Object.entries(schools).forEach(([id, school]) => {
    if (school.status === 'pending') {
      pendingSchools[id] = school;
    }
  });

  return pendingSchools;
};

export const approveSchool = async (schoolId: string, adminId: string): Promise<void> => {
  const schoolRef = ref(database, `schools/${schoolId}`);
  await update(schoolRef, {
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: adminId,
  });
};

export const rejectSchool = async (schoolId: string, adminId: string): Promise<void> => {
  const schoolRef = ref(database, `schools/${schoolId}`);
  await update(schoolRef, {
    status: 'rejected',
    approvedAt: new Date().toISOString(),
    approvedBy: adminId,
  });
};

export const updateSchool = async (schoolId: string, updates: Partial<School>): Promise<void> => {
  const schoolRef = ref(database, `schools/${schoolId}`);
  await update(schoolRef, updates);
};

export const getSchoolByPrincipalId = async (principalId: string): Promise<{ id: string; school: School } | null> => {
  const schools = await getAllSchools();

  for (const [id, school] of Object.entries(schools)) {
    if (school.principalId === principalId && school.status === 'approved') {
      return { id, school };
    }
  }

  return null;
};
