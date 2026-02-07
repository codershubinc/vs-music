import Badge from '@/components/Badge';

interface VersionBadgeProps {
    version: string;
    size?: 'sm' | 'md';
}

export default function VersionBadge({ version, size = 'md' }: VersionBadgeProps) {
    const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

    return (
        <Badge variant="secondary" size={size} className="gap-2.5">
            <span className={`${dotSize} rounded-full bg-[#007acc] animate-pulse`}></span>
            <span className="text-[#707070]">{version}</span>
        </Badge>
    );
}
