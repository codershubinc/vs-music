import { Star } from 'lucide-react';
import Badge from '@/components/Badge';

interface StarBadgeProps {
    count: number;
    size?: 'sm' | 'md';
}

export default function StarBadge({ count, size = 'md' }: StarBadgeProps) {
    const iconSize = size === 'sm' ? 12 : 14;

    return (
        <Badge variant="warning" size={size}>
            <Star size={iconSize} className="fill-yellow-400" />
            <span>{count} Stars</span>
        </Badge>
    );
}
