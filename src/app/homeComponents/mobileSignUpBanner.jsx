'use client';
import { useAuth } from '../providers/AuthProvider';
import { motion } from 'framer-motion';
import { SignUpButton } from '../components/SignUpButton';
import { UserPlus } from 'lucide-react';
export default function MobileSignupBanner() {
    const { user } = useAuth();

    if (user) {
        return null;
    }
    return (
        <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="block md:hidden fixed top-36 right-0 m-4 z-[9999] w-full max-w-40"
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
        </motion.div>
    )
}
