import { ref, get, set, push, update } from 'firebase/database';
import { database } from '@/config/firebase';
import { MealTracking, Student } from '@/types';

export const getMealTrackingByDate = async (date: string): Promise<MealTracking | null> => {
  const trackingRef = ref(database, `mealTracking/${date}`);
  const snapshot = await get(trackingRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as MealTracking;
};

export const saveMealTracking = async (date: string, teacherId: string, students: Record<string, Student>): Promise<void> => {
  const trackingRef = ref(database, `mealTracking/${date}`);
  await set(trackingRef, {
    teacherId,
    students
  });
};

export const addStudentMeal = async (date: string, teacherId: string, student: Student): Promise<string> => {
  const studentsRef = ref(database, `mealTracking/${date}/students`);
  const newStudentRef = push(studentsRef);
  await set(newStudentRef, student);

  await set(ref(database, `mealTracking/${date}/teacherId`), teacherId);

  return newStudentRef.key!;
};

export const updateStudentMeal = async (date: string, studentId: string, updates: Partial<Student>): Promise<void> => {
  const studentRef = ref(database, `mealTracking/${date}/students/${studentId}`);
  await update(studentRef, updates);
};

export const getAllMealTracking = async (): Promise<Record<string, MealTracking>> => {
  const trackingRef = ref(database, 'mealTracking');
  const snapshot = await get(trackingRef);

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val() as Record<string, MealTracking>;
};