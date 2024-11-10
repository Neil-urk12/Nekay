import { initializeApp } from "firebase/app";
import {
  enableIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDAjkmkmixb-HR-Gyh5K6QYWXo6Kc2S8Q0",
  authDomain: "nekay-b4b50.firebaseapp.com",
  projectId: "nekay-b4b50",
  storageBucket: "nekay-b4b50.firebasestorage.app",
  messagingSenderId: "833816673115",
  appId: "1:833816673115:web:2b51df86efd3f4bfeb787e",
  measurementId: "G-YJHYN5NKJ1",
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
