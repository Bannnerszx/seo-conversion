"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { emailUs } from "../actions/actions"
import Modal from "./Modal"

export default function ContactModal({ isOpen, setIsModalOpen }) {
  const [error, setError] = useState(null)
  const [isLoading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await emailUs({
        userName:  formData.name,
        userEmail: formData.email,
        subject:   formData.subject,
        message:   formData.message,
      })

      // success!
      setFormData({ name: '', email: '', subject: '', message: '' })
      setIsModalOpen(false)
    } catch (err) {
      console.error(err)
      setError('Oops — something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal context="order" showModal={isOpen} setShowModal={setIsModalOpen}>
      {error && (
        <div className="text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg w-full max-w-md relative animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Email Us</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="What is this regarding?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Your message here..."
              className="min-h-[120px]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex items-center">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
