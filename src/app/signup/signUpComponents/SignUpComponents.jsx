"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, User, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { handleSignUp } from "@/app/actions/actions"
import { signInWithPopup, GoogleAuthProvider, getAuth } from "firebase/auth"

export default function SignUpForm() {
    const router = useRouter()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showSuccessScreen, setShowSuccessScreen] = useState(false)
    const [scale, setScale] = useState(0)
    const [error, setError] = useState(null)

    const formRef = useRef(null)

    const sendTokenToServer = async (token) => {
        await fetch('/api/login-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        })
    }

    useEffect(() => {
        if (showSuccessScreen) {
            setTimeout(() => setScale(1), 100)
            const redirectTimer = setTimeout(() => {
                router.push("/login")
            }, 3000)
            return () => clearTimeout(redirectTimer)
        }
    }, [showSuccessScreen, router])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formRef.current) return

        const form = formRef.current
        const emailElem = form.elements.namedItem("email")

        // 1) Blank check
        if (!email.trim()) {
            setError("Email cannot be blank.")
            return
        }

        // 2) Type check (HTML5)
        if (!(emailElem instanceof HTMLInputElement) || !emailElem.validity.valid) {
            setError("Please enter a valid email address.")
            return
        }

        // 3) Confirm password
        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const result = await handleSignUp(email, password)
            if (!result.success) {
                setError(`Error [${result.code}]: ${result.message}`)
                return
            }
            setShowSuccessScreen(true)
        } catch (unexpected) {
            console.error(unexpected)
            setError(unexpected.message || "An unexpected error occurred.")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignUp = async () => {
        const auth = getAuth()
        setLoading(true)
        try {
            const provider = new GoogleAuthProvider()
            await signInWithPopup(auth, provider)
            const token = await auth.currentUser.getIdToken()
            await sendTokenToServer(token)
            window.location.href = "/"
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (showSuccessScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
                <div className="text-center px-4">
                    <div className="flex justify-center mb-6">
                        <CheckCircle
                            className="text-green-600 transition-all duration-500 ease-out"
                            size={80}
                            style={{
                                transform: `scale(${scale})`,
                                opacity: scale,
                            }}
                        />
                    </div>
                    <h2 className="text-3xl font-bold text-green-600 mb-4">Account Created!</h2>
                    <p className="text-xl text-gray-700 mb-6">Your account has been successfully created.</p>
                    <p className="text-gray-500">Redirecting to login page...</p>
                </div>
            </div>
        )
    }

    return (
        <Card className="w-full max-w-md shadow-lg z-10 mt-16 mx-4">
            <CardContent className="px-6 pt-8 pb-6">
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2 text-center">
                        <h1 className="text-2xl font-bold text-[#0000ff]">Create an account</h1>
                        <p className="text-gray-400">Sign Up</p>
                    </div>
                    {error && (
                        <p className="text-center text-red-600">{error}</p>
                    )}
                    <div className="space-y-5">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                type="email"
                                name="email"
                                placeholder="Email"
                                className="pl-10 py-5"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Password"
                                className="pr-10 py-5"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-3 flex items-center"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                            </button>
                        </div>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                className="pr-10 py-5"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-3 flex items-center"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                            </button>
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#0000ff] hover:bg-blue-700 py-5"
                        >
                            {loading ? "Signing up..." : "Sign Up"}
                        </Button>
                        <div className="relative flex items-center justify-center">
                            <div className="border-t border-gray-200 w-full"></div>
                            <span className="bg-white px-3 text-sm text-gray-500 absolute">or</span>
                        </div>
                        <Button variant="outline" className="w-full py-5" onClick={handleGoogleSignUp}>
                            <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                <path
                                    fill="#FFC107"
                                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
                c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
                c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                                />
                                <path
                                    fill="#FF3D00"
                                    d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
                C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                                />
                                <path
                                    fill="#4CAF50"
                                    d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
                c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                                />
                                <path
                                    fill="#1976D2"
                                    d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
                c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                                />
                            </svg>
                            Sign in with Google
                        </Button>
                    </div>
                    <div className="text-center text-sm">
                        <span className="text-gray-600">Already have an account?</span>{" "}
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Sign In
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}