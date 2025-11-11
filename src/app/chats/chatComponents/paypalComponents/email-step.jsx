"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function EmailStep({ onComplete, initialEmail = "" }) {
  const [email, setEmail] = useState(initialEmail)
  const [confirmEmail, setConfirmEmail] = useState(initialEmail)
  const [errors, setErrors] = useState({ email: "", confirmEmail: "" })

  const validateEmail = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(val)
  }

  const handleContinue = () => {
    const newErrors = { email: "", confirmEmail: "" }

    if (!email) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!confirmEmail) {
      newErrors.confirmEmail = "Please confirm your email"
    } else if (email !== confirmEmail) {
      newErrors.confirmEmail = "Email addresses do not match"
    }

    setErrors(newErrors)

    if (!newErrors.email && !newErrors.confirmEmail) {
      onComplete(email)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Confirm Your Email</h3>
        <p className="text-sm text-muted-foreground">
          We'll send your payment confirmation to this email address
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((prev) => ({ ...prev, email: "" }))
            }}
            className={errors.email ? "border-destructive" : ""}
            autoComplete="email"
            autoCapitalize="none"
            inputMode="email"
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-email" className="text-sm font-medium">
            Confirm Email Address
          </Label>
          <Input
            id="confirm-email"
            type="email"
            placeholder="your.email@example.com"
            value={confirmEmail}
            onChange={(e) => {
              setConfirmEmail(e.target.value)
              setErrors((prev) => ({ ...prev, confirmEmail: "" }))
            }}
            className={errors.confirmEmail ? "border-destructive" : ""}
            autoComplete="email"
            autoCapitalize="none"
            inputMode="email"
          />
          {/* FIX: use 'errors', not 'error' */}
          {errors.confirmEmail && (
            <p className="text-sm text-destructive">{errors.confirmEmail}</p>
          )}
        </div>
      </div>

      <Button
        onClick={handleContinue}
        className="w-full h-12 bg-[#0070BA] hover:bg-[#005EA6] text-white font-semibold"
      >
        Continue to Signature
      </Button>
    </div>
  )
}
