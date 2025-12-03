'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { SignUpButton } from '../components/SignUpButton';
import { UserPlus } from 'lucide-react';

export default function MobileSignupBanner() {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger the slide-in animation shortly after mounting
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    if (user) {
        return null;
    }

    return (
        <div
            className={`
                block md:hidden fixed top-36 right-0 m-4 z-[9999] w-full max-w-40
                transition-all duration-700 ease-out transform
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
        >
            <SignUpButton
                href="/signup"
                variant="contrast"
                size="sm"
                orientation="horizontal"
                widthClass="w-40"
            >
                <UserPlus className="mr-2 h-6 w-6" />
                Sign Up Free
            </SignUpButton>
        </div>
    )
}