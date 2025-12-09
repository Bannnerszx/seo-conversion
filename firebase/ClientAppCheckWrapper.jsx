'use client'
import dynamic from "next/dynamic";

const ClientAppCheck = dynamic(() => import('./ClientAppCheck'), {
    ssr: false
});

export default function ClientAppCheckWrapper() {
    return <ClientAppCheck />
}