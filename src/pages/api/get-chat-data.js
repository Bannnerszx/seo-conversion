// pages/api/get-chat-data.js
import { admin } from '@/lib/firebaseAdmin'

export default async function handler(req, res) {
  // 1) Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // 2) Grab chatId from query
  const { chatId } = req.query
  if (!chatId) {
    return res.status(400).json({ error: 'Missing `chatId` query parameter' })
  }

  try {
    // 3) Reference the chat document
    const chatRef = admin
      .firestore()
      .collection('chats')
      .doc(chatId)

    const chatSnap = await chatRef.get()
    if (!chatSnap.exists) {
      return res.status(404).json({ error: 'Chat not found' })
    }

    // 5) Return combined payload
    return res.status(200).json({
      id: chatSnap.id,
      ...chatSnap.data(),
    })
  } catch (error) {
    console.error('Error in /api/get-chat-data:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
