import { initializeApp } from "firebase/app";
import { FacebookAuthProvider } from 'firebase/auth';
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBevdS_e5G_DPwehEm1G1tGUDJjQWAKgKA",
  authDomain: "testoria-ba217.firebaseapp.com",
  projectId: "testoria-ba217",
  storageBucket:  "testoria-ba217.firebasestorage.app",
  messagingSenderId: "1026606002422",
  appId: "1:1026606002422:web:74e1091810cae03edbbcd7",
  measurementId: "G-4P59H2CNLZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;