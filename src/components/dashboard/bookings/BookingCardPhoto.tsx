import Image from 'next/image';

import { CATEGORY_CONFIG, CATEGORY_LABELS } from '@/types/facility';
import type { FacilityCategory } from '@/types/facility';

// Shape of component's props
interface Props {
    category?: FacilityCategory;
    name: string;
}

export default function BookingCardPhoto({ category, name }: Props) {
    const cfg = category ? CATEGORY_CONFIG[category] : null;
    
    return (
        <div className="relative h-28 bg-slate-200 overflow-hidden">
            {/* Cover image */}
            {cfg && (
                <Image 
                    className="object-cover"
                    src={cfg.image} 
                    alt={name} 
                    fill
                    sizes="(min-width: 672px) 672px, 100vw" 
                />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 to-black/10" />
            {/* Name and category pill */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex items-end justify-between gap-3">
                <p className="text-white font-semibold text-sm leading-tight drop-shadow truncate">
                    {name}
                </p>
                {cfg && category && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full text-white shrink-0 ${cfg.bg}`}>
                        {CATEGORY_LABELS[category]}
                    </span>
                )}
            </div>
        </div>
    );
}
