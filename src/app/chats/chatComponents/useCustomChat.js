"use client"

import { useState, useEffect } from "react"

// Sample data - in a real app, this would come from an API
const sampleMessages = {
  1: [
    { sender: "contact", text: "Hey, how are you?", time: "10:30 AM" },
    { sender: "me", text: "I'm good, thanks! How about you?", time: "10:32 AM" },
    { sender: "contact", text: "Doing well! Just working on some projects.", time: "10:35 AM" },
  ],
  2: [
    { sender: "contact", text: "Can we meet tomorrow?", time: "Yesterday" },
    { sender: "me", text: "Sure, what time works for you?", time: "Yesterday" },
    { sender: "contact", text: "How about 2 PM?", time: "Yesterday" },
    { sender: "me", text: "Sounds good!", time: "Yesterday" },
  ],
  3: [
    { sender: "contact", text: "I sent you the files", time: "Yesterday" },
    { sender: "me", text: "Got them, thanks!", time: "Yesterday" },
  ],
  4: [
    { sender: "me", text: "Hi Sarah, do you have a minute?", time: "Monday" },
    { sender: "contact", text: "Sure, what's up?", time: "Monday" },
    { sender: "me", text: "I need help with the design", time: "Monday" },
    { sender: "contact", text: "Thanks for your help!", time: "Monday" },
  ],
  5: [
    { sender: "contact", text: "Let's discuss the project", time: "Sunday" },
    { sender: "me", text: "I'm available tomorrow", time: "Sunday" },
  ],
}

export function useCustomChat(contactId) {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Load messages when contact changes
  // useEffect(() => {
  //   if (contactId) {
  //     setMessages(sampleMessages[contactId] || [])
  //   } else {
  //     setMessages([])
  //   }
  // }, [contactId])

  const sendMessage = (text) => {
    if (!contactId) return

    // Add user message
    const newUserMessage = {
      sender: "me",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, newUserMessage])

    // Simulate response
    setIsLoading(true)

    setTimeout(() => {
      const responseMessage = {
        sender: "contact",
        text: getRandomResponse(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      setMessages((prev) => [...prev, responseMessage])
      setIsLoading(false)
    }, 1500)
  }

  return {
    messages,
    sendMessage,
    isLoading,
  }
}

