import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDZefMnuN_tFuG_nJqfQ-varxgAysRNpts",
  authDomain: "pontuacoes-26b39.firebaseapp.com",
  projectId: "pontuacoes-26b39",
  storageBucket: "pontuacoes-26b39.firebasestorage.app",
  messagingSenderId: "7092040960",
  appId: "1:7092040960:web:ede36f56dab7504c5d2fe5"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
