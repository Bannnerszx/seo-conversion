'use client'
import { useState, useEffect } from "react";
// 1. Import async getter
import { getFirebaseFirestore } from "../../firebase/clientApp"; 
// 2. Remove static imports of firebase/firestore functions
// import { collection, query, where, onSnapshot } from "firebase/firestore"; 

export function useUnreadCount(userEmail) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!userEmail) {
            setCount(0);
            return;
        }

        let unsubscribe;

        const setupListener = async () => {
            try {
                // 3. Load Firestore and Functions dynamically
                const [db, { collection, query, where, onSnapshot }] = await Promise.all([
                    getFirebaseFirestore(),
                    import("firebase/firestore")
                ]);

                const q = query(
                    collection(db, 'chats'),
                    where('participants.customer', '==', userEmail),
                    where('customerRead', '==', false)
                );

                unsubscribe = onSnapshot(q, (snapshot) => {
                    setCount(snapshot.size);
                });
            } catch (error) {
                console.error("Error setting up listener:", error);
            }
        };

        setupListener();

        return () => unsubscribe && unsubscribe();
    }, [userEmail]);

    return count;
}