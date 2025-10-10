import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, database } from '@/config/firebase';
import { User } from '@/types';

export const signIn = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userRef = ref(database, `users/${userCredential.user.uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    throw new Error('User data not found');
  }

  const userData = snapshot.val() as User;
  await set(ref(database, `users/${userCredential.user.uid}/lastLogin`), new Date().toISOString());

  return { ...userData, email: userCredential.user.email || email };
};

export const signUp = async (email: string, password: string, name: string, role: 'principal' | 'donor'): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  const userData: User = {
    email,
    name,
    role,
    createdAt: new Date().toISOString(),
  };

  await set(ref(database, `users/${uid}`), userData);
  await set(ref(database, `users/${uid}/lastLogin`), new Date().toISOString());

  // Newly created Firebase users are automatically signed in. For workflows
  // that require users to confirm or explicitly sign in, sign them out here
  // so the app can direct them to the login screen.
  await firebaseSignOut(auth);

  return userData;
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getUserData = async (uid: string): Promise<User | null> => {
  const userRef = ref(database, `users/${uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as User;
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<User>
): Promise<void> => {
  const userRef = ref(database, `users/${uid}`);
  await update(userRef, updates);
};