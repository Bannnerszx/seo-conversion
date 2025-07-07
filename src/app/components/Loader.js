'use client'

import styles from './Loader.module.css'
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
export default function Loader() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className={styles.loader} />
        </div>,
        document.body
    );
}
