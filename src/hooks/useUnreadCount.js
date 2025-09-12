'use client'
import { useState, useEffect } from "react";
import { firestore } from "../../firebase/clientApp";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export function useUnreadCount(userEmail) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        // If there's no user, do nothing and ensure count is 0
        if (!userEmail) {
            setCount(0);
            return;
        }

        // Create the query to listen to
        const q = query(
            collection(firestore, 'chats'),
            where('participants.customer', '==', userEmail),
            where('customerRead', '==', false)
        );

        // onSnapshot sets up the real-time listener directly from the browser
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCount(snapshot.size); // Update the count with the number of unread chats
        }, (error) => {
            console.error("Error listening to unread count:", error);
            setCount(0);
        });

        // This function is called when the component unmounts to clean up the listener
        return () => unsubscribe();
    }, [userEmail]); // Rerun this effect if the userEmail changes

    return count;
}