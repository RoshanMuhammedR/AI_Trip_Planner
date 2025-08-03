// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1uU3Hk7iZhfeWN4sHys5ZiNtWoQICY0U",
  authDomain: "ai-travel-planner-19556.firebaseapp.com",
  projectId: "ai-travel-planner-19556",
  storageBucket: "ai-travel-planner-19556.firebasestorage.app",
  messagingSenderId: "762029129694",
  appId: "1:762029129694:web:1fa32a3d6979bb2b6c674f",
  measurementId: "G-47ZM9QDY85"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
