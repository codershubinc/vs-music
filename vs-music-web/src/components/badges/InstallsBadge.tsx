import Badge from '@/components/Badge';
import CountUp from '@/components/CountUp';

interface InstallsBadgeProps {
    count: number;
    size?: 'sm' | 'md';
}

export default function InstallsBadge({ count, size = 'md' }: InstallsBadgeProps) {
    return (
        <Badge variant="default" size={size}>
            <CountUp value={count} /> Installs
        </Badge>
    );
}
