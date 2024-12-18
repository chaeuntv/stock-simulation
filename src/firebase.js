

// src/firebase.js
import { initializeApp } from 'firebase/app'; // Firebase 앱 초기화
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'; // 인증 모듈화
import { getFirestore } from "firebase/firestore";

// Firebase 프로젝트 설정 (이 부분은 Firebase 콘솔에서 가져옵니다)
const firebaseConfig = {
  apiKey: "AIzaSyBi6HgXvBduO9VO769Rvoa84YU9p1AyggM",
  authDomain: "stock-simulation-7fd2d.firebaseapp.com",
  projectId: "stock-simulation-7fd2d",
  storageBucket: "stock-simulation-7fd2d.firebasestorage.app",
  messagingSenderId: "610225198715",
  appId: "1:610225198715:web:0604f68348b1fe81ec74de",
  measurementId: "G-30QYN7NZM8"
};


// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// 인증 객체 초기화
const auth = getAuth(app);
const db = getFirestore(app);

// 인증 및 Firestore 객체를 내보내기
export { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, db};
