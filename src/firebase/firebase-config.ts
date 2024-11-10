import { initializeApp } from "firebase/app";
import {
  enableIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

enableIndexedDbPersistence(db)
  .then(() => {
    console.log("Offline persistence enabled");
  })
  .catch((err) => {
    if (err.code == "failed-precondition") {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn(
        "Multiple tabs open, offline persistence can only be enabled in one tab at a time."
      );
    } else if (err.code == "unimplemented") {
      // The current browser doesn't support offline persistence
      console.warn("Current browser doesn't support offline persistence");
    }
  });

window.addEventListener("online", () => {
  console.log("App is online");
});
window.addEventListener("offline", () => {
  console.log("App is offline");
});

export { app, db };
