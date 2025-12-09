import { getApps, getApp, initializeApp } from "firebase/app";


const firebaseConfig = {
    apiKey: "AIzaSyC1oPK69XInlpw-E9BowLGocFq2i8wRjZA",
    authDomain: "real-motor-japan.firebaseapp.com",
    projectId: "real-motor-japan",
    storageBucket: "real-motor-japan.firebasestorage.app",
    messagingSenderId: "854100669672",
    appId: "1:854100669672:web:c224be87d85439b5af855d",
    measurementId: "G-SS7WCX5ZMV"
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