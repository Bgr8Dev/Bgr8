import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDLaPH3cVREnrmZxvjPRT86w9rZXuA5GEU",
  authDomain: "b8network.firebaseapp.com",
  projectId: "b8network",
  storageBucket: "b8network.firebasestorage.app",
  messagingSenderId: "297272606154",
  appId: "1:297272606154:web:6042d3a4a70a5301a5e333",
  measurementId: "G-T3M4QVLC02"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);