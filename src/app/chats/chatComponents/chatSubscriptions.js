// 2. Import the async getter
import { getFirebaseFirestore } from "../../../../firebase/clientApp"

export function subscribeToChatDoc(chatId, callback) {
    if (!chatId) return () => {}

    let unsubscribe = null;
    let isCancelled = false;

    // 3. Initialize asynchronously
    const initSubscription = async () => {
        try {
            // Load Firestore instance and SDK dynamically
            const [firestore, { doc, onSnapshot }] = await Promise.all([
                getFirebaseFirestore(),
                import("firebase/firestore")
            ]);

            // If the component unmounted while we were loading, stop here
            if (isCancelled) return;

            const chatDocRef = doc(firestore, 'chats', chatId);

            unsubscribe = onSnapshot(chatDocRef, (docSnap) => {
                if (!docSnap.exists()) {
                    callback(null);
                    return;
                }
                callback(docSnap.data());
            }, (err) => console.error('Error listening to chat doc:', err));

        } catch (error) {
            console.error("Failed to init chat subscription:", error);
        }
    };

    // Trigger the async setup
    initSubscription();

    // 4. Return a synchronous cleanup function
    // This allows your useEffects to work without changes
    return () => {
        isCancelled = true;
        if (unsubscribe) {
            unsubscribe();
        }
    };
}