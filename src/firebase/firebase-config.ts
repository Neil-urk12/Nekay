// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyDAjkmkmixb-HR-Gyh5K6QYWXo6Kc2S8Q0",
  authDomain: "nekay-b4b50.firebaseapp.com",
  projectId: "nekay-b4b50",
  storageBucket: "nekay-b4b50.firebasestorage.app",
  messagingSenderId: "833816673115",
  appId: "1:833816673115:web:2b51df86efd3f4bfeb787e",
  measurementId: "G-YJHYN5NKJ1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { app, db };
