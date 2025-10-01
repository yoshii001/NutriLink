import { ref, get, set, update, remove, push } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, database } from '@/config/firebase';
import { User, UserRole } from '@/types';

export const getAllUsers = async (): Promise<Record<string, User & { uid: string }>> => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);

  if (!snapshot.exists()) {
    return {};
  }

  const users = snapshot.val();
  const usersWithIds: Record<string, User & { uid: string }> = {};

  Object.entries(users).forEach(([uid, userData]) => {
    usersWithIds[uid] = {
      ...(userData as User),
      uid,
    };
  });

  return usersWithIds;
};

export const createUser = async (
  email: string,
  password: string,
  name: string,
  role: UserRole,
  schoolId?: string
): Promise<string> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  const userData: User = {
    email,
    name,
    role,
    createdAt: new Date().toISOString(),
    ...(schoolId && { schoolId }),
  };

  await set(ref(database, `users/${uid}`), userData);

  return uid;
};

export const updateUserData = async (uid: string, updates: Partial<User>): Promise<void> => {
  const userRef = ref(database, `users/${uid}`);
  await update(userRef, updates);
};

export const deleteUser = async (uid: string): Promise<void> => {
  const userRef = ref(database, `users/${uid}`);
  await remove(userRef);
};

export const getUsersByRole = async (role: UserRole): Promise<Record<string, User & { uid: string }>> => {
  const allUsers = await getAllUsers();
  const filteredUsers: Record<string, User & { uid: string }> = {};

  Object.entries(allUsers).forEach(([uid, user]) => {
    if (user.role === role) {
      filteredUsers[uid] = user;
    }
  });

  return filteredUsers;
};

export const getUsersBySchool = async (schoolId: string): Promise<Record<string, User & { uid: string }>> => {
  const allUsers = await getAllUsers();
  const filteredUsers: Record<string, User & { uid: string }> = {};

  Object.entries(allUsers).forEach(([uid, user]) => {
    if (user.schoolId === schoolId) {
      filteredUsers[uid] = user;
    }
  });

  return filteredUsers;
};

export const assignUserToSchool = async (uid: string, schoolId: string): Promise<void> => {
  await updateUserData(uid, { schoolId });
};

export const changeUserRole = async (uid: string, newRole: UserRole): Promise<void> => {
  await updateUserData(uid, { role: newRole });
};

export const getSystemStats = async (): Promise<{
  totalUsers: number;
  usersByRole: Record<UserRole, number>;
  totalSchools: number;
  approvedSchools: number;
  pendingSchools: number;
}> => {
  const usersRef = ref(database, 'users');
  const schoolsRef = ref(database, 'schools');

  const [usersSnapshot, schoolsSnapshot] = await Promise.all([
    get(usersRef),
    get(schoolsRef),
  ]);

  const users = usersSnapshot.exists() ? usersSnapshot.val() : {};
  const schools = schoolsSnapshot.exists() ? schoolsSnapshot.val() : {};

  const usersByRole: Record<UserRole, number> = {
    admin: 0,
    teacher: 0,
    principal: 0,
    donor: 0,
    parent: 0,
  };

  Object.values(users).forEach((user: any) => {
    if (user.role) {
      usersByRole[user.role as UserRole]++;
    }
  });

  let approvedSchools = 0;
  let pendingSchools = 0;

  Object.values(schools).forEach((school: any) => {
    if (school.status === 'approved') approvedSchools++;
    if (school.status === 'pending') pendingSchools++;
  });

  return {
    totalUsers: Object.keys(users).length,
    usersByRole,
    totalSchools: Object.keys(schools).length,
    approvedSchools,
    pendingSchools,
  };
};
