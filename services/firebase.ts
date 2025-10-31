import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCwPd9K18rWYt8djhm1QwDtKRMBvFh3YeQ",
  authDomain: "butchers-select.firebaseapp.com",
  projectId: "butchers-select",
  storageBucket: "butchers-select.firebasestorage.app",
  messagingSenderId: "494601573943",
  appId: "1:494601573943:web:d4d9a16e7872b7014691b2",
  measurementId: "G-P5NJ73PP42",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch((error) => {
      console.warn("Firebase analytics not supported:", error);
    });
}

export { app, db, storage, analytics };
