// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAQqKaM74ZZZvZVEs5a-YB0zKYAtL_SrIs",
  authDomain: "fetchgo-73a4c.firebaseapp.com",
  databaseURL: "https://fetchgo-73a4c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fetchgo-73a4c",
  storageBucket: "fetchgo-73a4c.firebasestorage.app",
  messagingSenderId: "845197410043",
  appId: "1:845197410043:web:ebb61f9aa059a82257fa5e",
  measurementId: "G-B10R2WSVJK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
const db = getDatabase(app);
const auth = getAuth(app);

// Export Firebase services
export { db, auth, app };