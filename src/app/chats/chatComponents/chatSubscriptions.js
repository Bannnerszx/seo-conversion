import { doc, onSnapshot } from "firebase/firestore"
import { firestore } from "../../../../firebase/clientApp"

export function subscribeToChatDoc(chatId, callback) {
    if (!chatId) return () => {}
    const chatDocRef = doc(firestore, 'chats', chatId)

    const unsubscribe = onSnapshot(chatDocRef, (docSnap) => {
        if (!docSnap.exists()) {
            callback(null)
            return
        }
        callback(docSnap.data())
    }, (err) => console.error('Error listening to chat doc:', err))

    return unsubscribe
}
