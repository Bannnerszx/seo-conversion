'use client'
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getFirebaseAuth } from "../../../../firebase/clientApp"
export default function AuthActionPage() {
  const params = useSearchParams();
  const router = useRouter();
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");
  const [emailForReset, setEmailForReset] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!mode || !oobCode) return;

    let mounted = true;
    setStatus("working");

    (async () => {
      try {
        const [auth, sdk] = await Promise.all([
          getFirebaseAuth(),
          import('firebase/auth')
        ]);

        if (!mounted) return;
        if (mode === 'verifyEmail') {
          await sdk.applyActionCode(auth, oobCode);
          if (!mounted) return;
          setStatus('success');
          router.push('/');
        } else if (mode === 'resetPassword') {
          const email = await sdk.verifyPasswordResetCode(auth, oobCode);
          if (!mounted) return;
          setEmailForReset(email);
          setStatus('idle')
        } else {
          setErrorMsg('Unsupported action');
          setStatus("error")
        }
      } catch (err) {
        if (!mounted) return;
        setErrorMsg(err.message);
        setStatus('error')
      }
    })();

    return () => { mounted = false }
  }, [mode, oobCode, router])

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!oobCode) return;

    setStatus('working');
    try {
      const [auth, sdk] = await Promise.all([
        getFirebaseAuth(),
        import('firebase/auth')
      ]);
      await sdk.confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
      router.push('/login')
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error')
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 mt-20">
      {status === 'working' && <p>Processing...</p>}
      {status === 'idle' && mode === 'verifyEmail' && (
        <p>Your email has been verified! Redirecting...</p>
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
  )
}