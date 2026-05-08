'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Pencil, Trash2, Users } from 'lucide-react';

import { CATEGORY_CONFIG, CATEGORY_LABELS } from '@/types/facility';
import type { Facility } from '@/types/facility';
import { getTodayLabel } from '@/lib/utils/openingHours';

// Shape of component's props
interface Props {
    facility: Facility;                     // Facility
    priority?: boolean;                     // Whether to eager-load the facility image
    onEdit: (facility: Facility) => void;   // Function used to open edit facility modal
    onRemove: (facility: Facility) => void; // Function used to open delete facility modal
}

export default function AdminFacilityCard({ facility, priority = false, onEdit, onRemove }: Props) {
    const cfg = CATEGORY_CONFIG[facility.category];   // Facility's configuration
    const Icon = cfg.icon;                            // Facility's icon

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Grey out card if facility is inactive */}
            <div className={facility.isActive ? undefined : 'opacity-60'}>
            {/* Card header */}
            <div className="relative h-40 overflow-hidden bg-slate-100">
                {/* Facility image */}
                <Image
                    className="object-cover"
                    src={cfg.image}
                    alt={CATEGORY_LABELS[facility.category]}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                    priority={priority}
                />
                {/* Dark overlay on top of image */}
                <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />

                {/* Facility icon + pills */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                    {/* Facility icon */}
                    <div className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm">
                        <Icon className={`w-4 h-4 ${cfg.text}`} />
                    </div>
                    <div className="flex items-center gap-1.5">
                        {/* Inactive pill */}
                        {!facility.isActive && (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-sm text-white">
                                Inactive
                            </span>
                        )}
                        {/* Category pill */}
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm ${cfg.text}`}>
                            {CATEGORY_LABELS[facility.category]}
                        </span>
                    </div>
                </div>
            </div>

            {/* Card body */}
            <div className="px-5 pt-4 pb-3 flex-1 flex flex-col gap-2">
                {/* Facility name + location */}
                <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{facility.name}</h3>
                    <p className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        {facility.location}
                    </p>
                </div>

                {/* Facility description */}
                <p className="text-sm text-slate-600 line-clamp-2 flex-1">{facility.description}</p>

                {/* Facility opening hours (today) + capacity */}
                <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {getTodayLabel(facility.openingHours)}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {facility.maxCapacity} capacity
                    </span>
                </div>
            </div>
            </div>

            {/* Card footer */}
            <div className="px-5 pb-5 flex items-center gap-2">
                {/* View button */}
                <Link
                    className="flex items-center justify-center gap-1.5 flex-1 py-2 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition-colors"
                    href={`/facilities/${facility.id}`}
                >
                    View <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                {/* Edit button */}
                <button
                    className="flex items-center justify-center gap-1.5 flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => onEdit(facility)}
                >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                {/* Delete button */}
                <button
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    onClick={() => onRemove(facility)}
                    title="Remove facility"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
