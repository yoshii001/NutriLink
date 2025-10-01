import { ref, get, set, push, update } from 'firebase/database';
import { database } from '@/config/firebase';
import { Teacher } from '@/types';

export const addTeacher = async (teacherData: Omit<Teacher, 'createdAt'>): Promise<string> => {
  const teachersRef = ref(database, 'teachers');
  const newTeacherRef = push(teachersRef);

  const teacher: Teacher = {
    ...teacherData,
    createdAt: new Date().toISOString(),
  };

  await set(newTeacherRef, teacher);
  return newTeacherRef.key!;
};

export const getTeacherById = async (teacherId: string): Promise<Teacher | null> => {
  const teacherRef = ref(database, `teachers/${teacherId}`);
  const snapshot = await get(teacherRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as Teacher;
};

export const getAllTeachers = async (): Promise<Record<string, Teacher>> => {
  const teachersRef = ref(database, 'teachers');
  const snapshot = await get(teachersRef);

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val() as Record<string, Teacher>;
};

export const getTeachersBySchoolId = async (schoolId: string): Promise<Record<string, Teacher>> => {
  const teachers = await getAllTeachers();
  const schoolTeachers: Record<string, Teacher> = {};

  Object.entries(teachers).forEach(([id, teacher]) => {
    if (teacher.schoolId === schoolId) {
      schoolTeachers[id] = teacher;
    }
  });

  return schoolTeachers;
};

export const updateTeacher = async (teacherId: string, updates: Partial<Teacher>): Promise<void> => {
  const teacherRef = ref(database, `teachers/${teacherId}`);
  await update(teacherRef, updates);
};

export const deactivateTeacher = async (teacherId: string): Promise<void> => {
  const teacherRef = ref(database, `teachers/${teacherId}`);
  await update(teacherRef, { isActive: false });
};

export const activateTeacher = async (teacherId: string): Promise<void> => {
  const teacherRef = ref(database, `teachers/${teacherId}`);
  await update(teacherRef, { isActive: true });
};
