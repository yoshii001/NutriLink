import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCm-c5f6h_CHCTw95nnZQE5qYfMMqk-a4o",
  authDomain: "kids-feed.firebaseapp.com",
  databaseURL: "https://kids-feed-default-rtdb.firebaseio.com",
  projectId: "kids-feed",
  storageBucket: "kids-feed.firebasestorage.app",
  messagingSenderId: "256985647929",
  appId: "1:256985647929:web:5b4db8a62d626c0db9f6e8",
  measurementId: "G-1FFEDF4FPJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;