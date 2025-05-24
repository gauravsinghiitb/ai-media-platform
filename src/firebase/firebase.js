import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAMmdwsDZMZ5DJqGAHa4p6alcHY0-qdpZ4",
  authDomain: "ai-media-platform.firebaseapp.com",
  databaseURL: "https://ai-media-platform-default-rtdb.firebaseio.com",
  projectId: "ai-media-platform",
  storageBucket: "ai-media-platform.firebasestorage.app",
  messagingSenderId: "729899008110",
  appId: "1:729899008110:web:e98ee36968814dae78267f",
  measurementId: "G-N7CQWMT1V6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { db, storage, auth, googleProvider };