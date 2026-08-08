// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBPsX2XBRavYr9Pq_e1lDQJc33B1pviDwo",
  authDomain: "meu-app-txt.firebaseapp.com",
  projectId: "meu-app-txt",
  storageBucket: "meu-app-txt.firebasestorage.app",
  messagingSenderId: "874084952005",
  appId: "1:874084952005:web:0da0226bfda53965404dac",
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);