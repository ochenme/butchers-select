// Fix: Use modular imports for Firebase to resolve module resolution issues.
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDlXLQd2pOtlZvKYnuw3xpV6SxULIKSqg4",
  authDomain: "meatweb-ff8d6.firebaseapp.com",
  projectId: "meatweb-ff8d6",
  storageBucket: "meatweb-ff8d6.firebasestorage.app",
  messagingSenderId: "328033844639",
  appId: "1:328033844639:web:ebbbcf6c7a3e48ac2d91aa",
  measurementId: "G-2X157SSC2J",
};

const app = (() => {
  try {
    return initializeApp(firebaseConfig);
  } catch (error) {
    const host = typeof window !== "undefined" ? window.location.host : "server";
    if (error instanceof Error && error.message.includes("Invalid API key")) {
      console.error(
        `Firebase API key was rejected for host "${host}". If you are previewing on a new domain (for example, Google AI Studio), add that domain to your Firebase project's authorized domains or use environment-specific config keys.`,
      );
    }
    throw error;
  }
})();
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