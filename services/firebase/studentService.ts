import { ref, get, push, set, update, remove } from 'firebase/database';
import { database } from '@/config/firebase';
import { StudentProfile } from '@/types';

export const getStudentsByTeacher = async (teacherId: string): Promise<Record<string, StudentProfile>> => {
  const studentsRef = ref(database, `students/${teacherId}`);
  const snapshot = await get(studentsRef);

  if (!snapshot.exists()) return {};
  return snapshot.val() as Record<string, StudentProfile>;
};

export const addStudent = async (teacherId: string, student: StudentProfile): Promise<string> => {
  try {
    const studentsRef = ref(database, `students/${teacherId}`);
    const newRef = push(studentsRef);
    // remove undefined values because RTDB fails when values contain undefined
    const raw = { ...student, createdAt: new Date().toISOString() } as any;
    const payload = JSON.parse(JSON.stringify(raw));
    await set(newRef, payload);
    return newRef.key!;
  } catch (err) {
    console.error('studentService.addStudent error:', err, { teacherId, student });
    throw err;
  }
};

export const updateStudent = async (teacherId: string, studentId: string, updates: Partial<StudentProfile>): Promise<void> => {
  const studentRef = ref(database, `students/${teacherId}/${studentId}`);
  try {
    // strip undefined values from updates
    const payload = JSON.parse(JSON.stringify(updates));
    await update(studentRef, payload);
  } catch (err) {
    console.error('studentService.updateStudent error:', err, { teacherId, studentId, updates });
    throw err;
  }
};

export const deleteStudent = async (teacherId: string, studentId: string): Promise<void> => {
  try {
    const studentRef = ref(database, `students/${teacherId}/${studentId}`);
    await remove(studentRef);
  } catch (err) {
    console.error('studentService.deleteStudent error:', err, { teacherId, studentId });
    throw err;
  }
};
