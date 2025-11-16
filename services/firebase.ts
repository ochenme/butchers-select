// Fix: Use namespace imports for firebase to resolve module resolution issues.
import * as firebaseApp from "firebase/app";
import * as firebaseAnalytics from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDlXLQd2pOtlZvKYnuw3xpV6SxULIKSqg4",
  authDomain: "meatweb-ff8d6.firebaseapp.com",
  projectId: "meatweb-ff8d6",
  storageBucket: "meatweb-ff8d6.firebasestorage.app",
  messagingSenderId: "328033844639",
  appId: "1:328033844639:web:ebbbcf6c7a3e48ac2d91aa",
  measurementId: "G-2X157SSC2J"
};

const app = firebaseApp.initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
let analytics: firebaseAnalytics.Analytics | null = null;

if (typeof window !== "undefined") {
  firebaseAnalytics.isSupported()
    .then((supported) => {
      if (supported) {
        analytics = firebaseAnalytics.getAnalytics(app);
      }
    })
    .catch((error) => {
      console.warn("Firebase analytics not supported:", error);
    });
}

export { app, db, storage, analytics };