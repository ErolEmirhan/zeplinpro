import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyD8Jr2nBNXMGwb8xAN2UorXfQcOPu_MLto",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "hizlitedarik.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "hizlitedarik",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "hizlitedarik.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "550305654380",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:550305654380:web:797e487c91155d0e231a49",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-K4QEE326K7",
};

let appSingleton: FirebaseApp | null = null;
let dbSingleton: Firestore | null = null;

function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase yalnızca tarayıcıda başlatılır.");
  }
  if (!appSingleton) {
    appSingleton = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  }
  return appSingleton;
}

export function getDb(): Firestore {
  if (typeof window === "undefined") {
    throw new Error("Firestore yalnızca tarayıcıda kullanılır.");
  }
  if (!dbSingleton) {
    dbSingleton = getFirestore(getFirebaseApp());
  }
  return dbSingleton;
}

export function initAnalytics() {
  if (typeof window === "undefined") return;
  isSupported().then((ok) => {
    if (ok && firebaseConfig.measurementId) {
      getAnalytics(getFirebaseApp());
    }
  });
}
