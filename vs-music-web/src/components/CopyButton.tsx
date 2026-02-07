'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export default function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="p-2 hover:bg-white/10 rounded-md transition-colors"
            title="Copy to clipboard"
        >
            {copied ? (
                <Check size={16} className="text-green-400" />
            ) : (
                <Copy size={16} className="text-zinc-400 hover:text-white" />
            )}
        </button>
    );
}
