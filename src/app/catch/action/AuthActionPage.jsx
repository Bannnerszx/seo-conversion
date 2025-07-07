"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getAuth,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";

export default function AuthActionPage() {
  const params = useSearchParams();
  const router = useRouter();
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");

  const [emailForReset, setEmailForReset] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("idle"); // "idle" | "working" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  // Handle incoming action codes
  useEffect(() => {
    if (!mode || !oobCode) return;
    const auth = getAuth();
    setStatus("working");

    if (mode === "verifyEmail") {
      applyActionCode(auth, oobCode)
        .then(() => {
          setStatus("success");
          router.push("/");
        })
        .catch((err) => {
          setErrorMsg(err.message);
          setStatus("error");
        });
    } else if (mode === "resetPassword") {
      verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
          setEmailForReset(email);
          setStatus("idle");
        })
        .catch((err) => {
          setErrorMsg(err.message);
          setStatus("error");
        });
    } else {
      setErrorMsg("Unsupported action");
      setStatus("error");
    }
  }, [mode, oobCode, router]);

  // Submit new password and redirect on success
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!oobCode) return;

    setStatus("working");
    try {
      await confirmPasswordReset(getAuth(), oobCode, newPassword);
      setStatus("success");
      router.push("/login");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 mt-20">
      {status === "working" && <p>Processing…</p>}

      {/* We no longer need a manual button here, since we auto-redirect */}
      {status === "success" && mode === "verifyEmail" && (
        <p>Your email has been verified! Redirecting…</p>
      )}

      {status === "idle" && mode === "resetPassword" && emailForReset && (
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <p>
            Reset password for <strong>{emailForReset}</strong>
          </p>
          <input
            type="password"
            placeholder="New password"
            className="w-full p-2 border rounded"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Set Password
          </button>
        </form>
      )}

      {status === "success" && mode === "resetPassword" && (
        <p>Password has been reset! Redirecting…</p>
      )}

      {status === "error" && (
        <div className="text-red-600">
          <p>Something went wrong:</p>
          <pre>{errorMsg}</pre>
        </div>
      )}
    </div>
  );
}
