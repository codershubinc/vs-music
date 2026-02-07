import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'secondary' | 'warning';
    size?: 'sm' | 'md';
    className?: string;
}

const variants = {
    default: 'border-[#1a1a1a] bg-[#161616] text-white',
    primary: 'border-[#007acc]/30 bg-[#007acc]/15 text-[#007acc]',
    secondary: 'border-[#1a1a1a] bg-[#161616] text-[#b0b0b0]',
    warning: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400',
};

const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-1.5 text-sm',
};

export default function Badge({
    children,
    variant = 'default',
    size = 'md',
    className
}: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 rounded-full border font-bold',
                variants[variant],
                sizes[size],
                className
            )}
        >
            {children}
        </span>
    );
}
