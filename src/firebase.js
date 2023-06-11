import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBY5QRlRd9XIfw-euveL8CfbKT0MQcWQv4",
  authDomain: "auracle0.firebaseapp.com",
  projectId: "auracle0",
  storageBucket: "auracle0.appspot.com",
  messagingSenderId: "552966059534",
  appId: "1:552966059534:web:e0d987fcc8dd500b02ee5f",
  measurementId: "G-ZD6EVQBCN9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
const signInWithGoogle = async () => {
  const res = await signInWithPopup(auth, googleProvider);
  document.cookie = "uid="+res.user.uid+";path=/";
  // setCookie('uid', res.user.uid, {path: '/', secure: true});
};


const logInWithEmailAndPassword = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error(err);
  }
};

const registerWithEmailAndPassword = async (email, password) => {
  const res = await createUserWithEmailAndPassword(auth, email, password);
  document.cookie = "uid="+res.user.uid+";path=/";
  // setCookie('uid', res.user.uid, {path: '/', secure: true});
};

const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    console.error(err);
    // alert(err.message);
  }
};

const logout = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error(err);
    //alert(err.message);
  }
  document.cookie = "uid=; path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  document.cookie = "pid=; path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  window.location = '/';
};

export {auth, db, logInWithEmailAndPassword, sendPasswordReset, logout, signInWithGoogle, registerWithEmailAndPassword};
