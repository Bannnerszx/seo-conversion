// pages/api/sendMessage.js
import { db } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      chatId,
      newMessage,
      userEmail,
      formattedTime,
      ip,
      ipCountry,
      ipCountryCode,
    } = req.body;

    // Log incoming data for debugging
    console.log("Received data:", { chatId, newMessage, userEmail, formattedTime, ip, ipCountry, ipCountryCode });

    if (!chatId) {
      throw new Error("Missing chatId");
    }
    if (!newMessage) {
      throw new Error("Message text is empty");
    }

    // Create a new document in the messages subcollection for the chat
    const newMessageDocRef = db
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .doc(); // generates a new doc id

    const messageData = {
      sender: userEmail,
      text: newMessage,
      timestamp: formattedTime,
      ip,
      ipCountry,
      ipCountryCode,
    };

    // Save the new message document
    await newMessageDocRef.set(messageData);
    console.log("Message document saved successfully.");

    // Check if the parent chat document exists before updating it
    const chatDocRef = db.collection("chats").doc(chatId);
    const chatDocSnapshot = await chatDocRef.get();
    if (!chatDocSnapshot.exists) {
      console.warn(`Chat document with ID ${chatId} does not exist. Creating a new one.`);
      // Optionally, create the chat document if it doesn't exist:
      await chatDocRef.set({
        lastMessage: newMessage,
        lastMessageDate: formattedTime,
        lastMessageSender: userEmail,
        read: false,
        readBy: [],
      });
    } else {
      // Update the parent chat document with the last message details
      await chatDocRef.update({
        lastMessage: newMessage,
        lastMessageDate: formattedTime,
        lastMessageSender: userEmail,
        read: false,
        readBy: [],
      });
    }
    console.log("Parent chat document updated successfully.");

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
