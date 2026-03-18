"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FlipToggleNav({ to, label }) {
    const router = useRouter();
    const [isFlipping, setIsFlipping] = useState(false);

    const handleNavigate = () => {
        if (isFlipping) {
            return;
        }

        setIsFlipping(true);

        window.setTimeout(() => {
            router.push(to);
        }, 420);
    };

    return (
        <button type="button" className="flip-nav-button" aria-label={label} onClick={handleNavigate}>
            <motion.span
                className={`flip-nav-card ${isFlipping ? "is-flipping" : ""}`}
                whileHover={!isFlipping ? { scale: 1.04 } : undefined}
                whileTap={!isFlipping ? { scale: 0.96 } : undefined}
            >
                <span className="flip-face flip-face-front">🂠</span>
                <span className="flip-face flip-face-back">🂠</span>
            </motion.span>
        </button>
    );
}
