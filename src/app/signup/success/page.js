'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupSuccess() {
    const router = useRouter()
    const [scale, setScale] = useState(0)

    useEffect(() => {
        // animate the check icon
        const t = setTimeout(() => setScale(1), 50)

        // (Optional) fire analytics once
        // if (!sessionStorage.getItem('signupConvFired')) {
        //   sessionStorage.setItem('signupConvFired', '1')
        //   window.gtag?.('event', 'sign_up', { method: 'password' })
        // }

        // redirect to login after 2s
        const r = setTimeout(() => router.replace('/login'), 9000)
        return () => { clearTimeout(t); clearTimeout(r) }
    }, [router])

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
            <div className="text-center px-4">
                <div className="flex justify-center mb-6">
                    {/* Inline check icon (no extra imports) */}
                    <svg width="80" height="80" viewBox="0 0 24 24"
                        style={{ transform: `scale(${scale})`, opacity: scale, transition: 'transform 500ms ease-out, opacity 500ms ease-out' }}
                        className="text-green-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <path d="m9 11 3 3L22 4" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-green-600 mb-4">Account Created!</h2>
                <p className="text-xl text-gray-700 mb-6">Your account has been successfully created.</p>
                <p className="text-gray-500">Redirecting to login page...</p>
            </div>
        </div>
    )
}
