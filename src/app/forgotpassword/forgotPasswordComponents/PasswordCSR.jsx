"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { sendPasswordResetEmail, getAuth } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
export default function ForgotPasswordCSR() {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const actionCodeSettings = {
        url: "http://localhost:3000/catch/action",
        handleCodeInApp: true,
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const auth = getAuth()
        try {
            // Simulate API call
            await sendPasswordResetEmail(auth, email, actionCodeSettings)
            setIsSubmitted(true);
            toast("Reset link sent", {
                description: <span style={{ color: "gray" }}>Please check your email for password reset instructions.</span>,
            });
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center z-10 p-1">
            <Card className="w-full max-w-[750px] shadow-lg bg-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-bold text-blue-800">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email address below and we'll send you instructions to reset your password.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                name="email"
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <Button
                                type="submit"
                                className="w-full bg-blue-700 hover:bg-blue-800 text-white h-10"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Sending..." : "Send Reset Link"}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-md text-blue-800">
                                <p className="font-medium">Reset link sent!</p>
                                <p className="text-sm mt-1">
                                    We've sent password reset instructions to {email}. Please check your inbox.
                                </p>
                            </div>

                            <Button
                                type="button"
                                className="w-full bg-blue-700 hover:bg-blue-800 text-white h-10"
                                onClick={() => setIsSubmitted(false)}
                            >
                                Send Again
                            </Button>
                        </div>
                    )}

                    <div className="mt-4 text-center">
                        <Link href="/login" className="inline-flex items-center text-blue-700 hover:text-blue-800 text-sm">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
