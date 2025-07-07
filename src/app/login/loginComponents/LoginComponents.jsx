"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../../../firebase/clientApp";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();
  const params = useSearchParams();
  const redirectPath = params.get("redirect");
  const formRef = useRef(null)

  // Helper function to send token to API
  const sendTokenToServer = async (token) => {
    await fetch('/api/login-api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token })
    });
  };
  const [loading, setLoading] = useState(false);
  // Handle login with email and password
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!formRef.current) return;
    const form = formRef.current;
    const emailElem = form.elements.namedItem("email");

    setError(null);
    setLoading(true);

    // 1) Check for empty email
    if (!email.trim()) {
      setError("Email cannot be blank.");
      setLoading(false);
      return;
    }

    // 2) HTML5 validity check
    if (!(emailElem instanceof HTMLInputElement) || !emailElem.validity.valid) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      // 3) Attempt sign-in
      await signInWithEmailAndPassword(auth, email, password);

      // 4) If successful, grab token and redirect
      const token = await auth.currentUser.getIdToken();
      await sendTokenToServer(token);
      window.location.href = redirectPath || "/";
    } catch (err) {
      // console.error("Email login error:", err);

      // 5) Map Firebase error codes to user-friendly messages
      const code = err.code || err.message;
      switch (code) {
        case "auth/invalid-credential":
          setError("Incorrect password/User not found. Please try again.");
          break;
        case "auth/invalid-email":
          setError("That email address is not valid.");
          break;
        case "auth/user-disabled":
          setError("This account has been disabled.");
          break;
          case "auth/missing-password":
            setError("Password cannot be blank.");
            break;
        default:
          setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      // 6) Always turn off the loading spinner
      setLoading(false);
    }
  };



  // Handle login with Google
  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);

      // Optional: send the token if needed
      const token = await auth.currentUser.getIdToken();
      await sendTokenToServer(token);

      // ✅ Full page reload to sync auth context properly
      window.location.href = redirectPath || "/";
    } catch (err) {
      console.error("Google login error:", err);
      setError(err.message);
    }
  };


  return (
    <Card className="w-full max-w-md shadow-lg z-10 h-[550px] mx-4">
      <CardContent className="px-6 pt-8 pb-6">
        <div className="space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-[#0000ff]">Log in to continue</h1>
            <p className="text-gray-400">Welcome Back!</p>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          {/* Email/Password Login Form */}
          <form ref={formRef} onSubmit={handleEmailLogin} className="space-y-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                name="email"
                type="email"
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
                placeholder="Password"
                name="password"
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
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="accent-blue-600" />
                <Label htmlFor="remember" className="text-sm">
                  Remember Me
                </Label>
              </div>
              <Link href="/forgotpassword" className="text-sm text-blue-600 hover:underline">
                Forgot Password?
              </Link>
            </div>

            <Button disabled={loading} onClick={handleEmailLogin} type="submit" className="w-full bg-[#0000ff] hover:bg-blue-700 py-5">
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-200 w-full"></div>
            <span className="bg-white px-3 text-sm text-gray-500 absolute">or</span>
          </div>

          {/* Google Login Button */}
          <Button variant="outline" className="w-full py-5" onClick={handleGoogleLogin}>
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

          <div className="text-center text-sm">
            <span className="text-gray-600">Don&apos;t have an account yet?</span>{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
