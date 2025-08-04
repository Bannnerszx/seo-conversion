"use client"

import { useState, useEffect } from "react"

// Sample data - in a real app, this would come from an API


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

