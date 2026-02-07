import Badge from '@/components/Badge';

interface CategoryBadgeProps {
    label: string;
    size?: 'sm' | 'md';
}

export default function CategoryBadge({ label, size = 'md' }: CategoryBadgeProps) {
    return (
        <Badge variant="primary" size={size} className="uppercase tracking-wider">
            {label}
        </Badge>
    );
}
