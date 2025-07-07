'use client';
import { SignUpButton } from "../components/SignUpButton"
import { useAuth } from '../providers/AuthProvider';
import { UserPlus } from "lucide-react";
export default function DesktopSignUpBanner() {
    const { user } = useAuth();

    if (user) {
        return null;
    }
    return (

        <div className="hidden md:block md:absolute top-44 left-10 m-4 z-20 w-full max-w-64">
            <SignUpButton
                href="/signup"
                variant="contrast"
                size="xl"
                orientation="vertical"
                widthClass="w-full"
            >
                <UserPlus className="mb-2 h-10 w-10" />
                Sign Up Free
            </SignUpButton>
        </div>

    )
}