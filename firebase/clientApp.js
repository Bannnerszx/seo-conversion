import { initializeApp, getApps, getApp } from "firebase/app";
// ❌ REMOVE top-level imports of services
// import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage";
// import { getAuth } from 'firebase/auth'
// import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyDwjLbUFMDEyXB7NT63QJonc1NXZH3w07k",
    authDomain: "samplermj.firebaseapp.com",
    databaseURL: "https://samplermj-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "samplermj",
    storageBucket: "samplermj.appspot.com",
    messagingSenderId: "879567069316",
    appId: "1:879567069316:web:1208cd45c8b20ca6aba2d1",
    measurementId: "G-L80RXVVXY6"
};

// 1. Initialize App synchronously (it's fast)
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Export getters instead of instances
// This ensures the heavy SDK code is only executed when you call 'getAuth()', not on page load.
export const getFirebaseAuth = async () => {
    const { getAuth } = await import('firebase/auth');
    return getAuth(firebaseApp);
}

export const getFirebaseFirestore = async () => {
    const { getFirestore } = await import('firebase/firestore');
    return getFirestore(firebaseApp);
}

export const getFirebaseStorage = async () => {
    const { getStorage } = await import('firebase/storage');
    return getStorage(firebaseApp);
}

export const getFirebaseFunctions = async () => {
    const { getFunctions } = await import('firebase/functions');
    return getFunctions(firebaseApp, 'asia-northeast2');
}

// Keep the app export if needed for some specific legacy check, but prefer the async getters
export { firebaseApp };