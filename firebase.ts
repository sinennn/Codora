/// <reference types="vite/client" />
 console.log("God Abeg")
  
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    EmailAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    
  } from "firebase/auth";
  import { getFirestore } from "firebase/firestore";
  import { getStorage } from "firebase/storage";
  import { getDatabase } from "firebase/database";
  

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID,
    measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
console.log(analytics)
const auth = getAuth(app);
const firestore = getFirestore(app); 
const realtimeDatabase = getDatabase(app);
const storage = getStorage(app);
const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Persistence set to local"))
  .catch((error) => console.error("Error setting persistence:", error));

onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    console.log("User is signed in:", currentUser.displayName);
  } else {
    console.log("No user signed in");
  }
});

const googleProvider = new GoogleAuthProvider();

export {
  app,
  auth,
  firestore, 
  realtimeDatabase,
  storage,
  googleProvider,
  onAuthStateChanged,
  signInWithPopup,
  EmailAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseConfig,
  signOut,
  getAuth, 
  db
};

