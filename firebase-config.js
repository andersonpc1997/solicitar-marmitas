/**
 * firebase-config.js
 * Oilema Sementes — Controle de Marmitas
 *
 * ⚠️  PREENCHA COM AS CREDENCIAIS DO SEU PROJETO FIREBASE
 *     Veja o arquivo LEIA-ME.md para instruções passo a passo.
 */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBbZq0obh9QWTccZSIyQCXKbJI4_AXFPQ",
  authDomain: "oilema-marmitas.firebaseapp.com",
  databaseURL: "https://oilema-marmitas-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "oilema-marmitas",
  storageBucket: "oilema-marmitas.firebasestorage.app",
  messagingSenderId: "644651134486",
  appId: "1:644651134486:web:d2f3b1eb40f2fc398f0f37"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);