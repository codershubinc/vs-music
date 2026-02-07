'use client';

import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

interface CountUpProps {
    value: number;
    className?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    delay?: number;
}

export default function CountUp({
    value,
    className = "",
    prefix = "",
    suffix = "",
    decimals = 0,
    delay = 0,
}: CountUpProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(0);

    // Smooth spring animation
    const springValue = useSpring(motionValue, {
        damping: 30,
        stiffness: 100,
        mass: 0.5, // Lighter mass for snappier start
    });

    const isInView = useInView(ref, { once: true, margin: "0px" });

    // Trigger animation when in view or value changes
    useEffect(() => {
        if (isInView) {
            // Small delay support
            const timeout = setTimeout(() => {
                motionValue.set(value);
            }, delay * 1000);
            return () => clearTimeout(timeout);
        }
    }, [motionValue, isInView, value, delay]);

    useEffect(() => {
        return springValue.on("change", (latest) => {
            if (ref.current) {
                // Format the number (e.g., 1,000.00)
                const formattedNumber = latest.toFixed(decimals);
                const parts = formattedNumber.split('.');

                // Add commas to integer part
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

                ref.current.textContent = `${prefix}${parts.join('.')}${suffix}`;
            }
        });
    }, [springValue, decimals, prefix, suffix]);

    return (
        <span
            className={`${className} font-mono tabular-nums`} // tabular-nums prevents jitter
            ref={ref}
        >
            {prefix}0{suffix}
        </span>
    );
}