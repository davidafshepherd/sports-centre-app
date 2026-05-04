import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Users } from 'lucide-react';

import { WEEK_DAYS, DAY_LABELS, getTodayKey } from '@/lib/utils/openingHours';
import { CATEGORY_CONFIG, CATEGORY_LABELS } from '@/types/facility';
import type {Facility} from '@/types/facility';

// Shape of component's props
interface Props {
    facility: Facility, // Facility
}

export default function FacilityDetailsCard({ facility }: Props) {
    const cfg  = CATEGORY_CONFIG[facility.category];    // Facility's configuration
    const Icon = cfg.icon;                              // Facility's icon
    const todayKey = getTodayKey();                     // Today's weekday key

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Card header */}
            <div className="relative h-52 overflow-hidden bg-slate-100">
                {/* Facility image */}
                <Image 
                    className="object-cover" 
                    src={cfg.image} 
                    alt={CATEGORY_LABELS[facility.category]}
                    fill sizes="(min-width: 672px) 672px, 100vw"
                    priority 
                />
                {/* Dark overlay on top of image */}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-black/10" />

                {/* Back button */}
                <Link href="/facilities"
                    className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-medium text-white bg-black/30 backdrop-blur-sm hover:bg-black/50 px-3 py-1.5 rounded-full transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> 
                    Back to Facilities
                </Link>

                {/* Facility info + pills */}
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
                    {/* Facility info */}
                    <div className="flex items-center gap-3">
                        {/* Facility icon */}
                        <div className="p-2.5 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm">
                            <Icon className={`w-5 h-5 ${cfg.text}`} />
                        </div>
                        {/* Facility name + location + capacity */}
                        <div>
                            <h1 className="text-xl font-bold text-white leading-tight drop-shadow">
                                {facility.name}
                            </h1>
                            <p className="flex items-center gap-1 text-sm text-white/80 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 shrink-0" /> 
                                {facility.location}
                            </p>
                            <p className="flex items-center gap-1 text-sm text-white/80 mt-0.5">
                                <Users className="w-3.5 h-3.5 shrink-0" /> 
                                {facility.maxCapacity} capacity
                            </p>
                        </div>
                    </div>
                    {/* Facility pills */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {/* Facility category pill */}
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm ${cfg.text}`}>
                            {CATEGORY_LABELS[facility.category]}
                        </span>
                        {/* Facility inactive pill */}
                        {!facility.isActive && (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-sm text-white">
                                Inactive
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Card Body */}
            <div className="px-6 py-5 space-y-5">
                {/* Facility description */}
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{facility.description}</p>
                </div>

                {/* Facility opening hours */}
                <div>
                    {/* Section title */}
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> 
                            Opening Hours
                        </p>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {facility.slotDurationMins ?? 60} min slots
                        </span>
                    </div>
                    {/* Render opening hours for each day of the week */}
                    <div className="space-y-1">
                        {WEEK_DAYS.map(day => {
                            const h = facility.openingHours[day];   // Opening hours for the day
                            const isToday = day === todayKey;       // Whether this day is today's day
                            return (
                                <div 
                                    key={day} 
                                    className={[
                                        "flex items-center justify-between px-3 py-1.5 rounded-lg",
                                        isToday ? `${cfg.lightBg} ring-1 ring-inset ${cfg.ring}` : "",
                                    ].join(" ")}
                                >
                                    { /* Render label for the day */ }
                                    <span className={`text-sm font-medium w-10 ${isToday ? cfg.text : "text-slate-600"}`}>
                                        {DAY_LABELS[day]}
                                    </span>
                                    {h ? (
                                        // Render opening hours for an open day
                                        <span className={`text-sm ${isToday ? cfg.text : "text-slate-700"}`}>
                                            {h.open} - {h.close}
                                        </span>
                                    ) : (
                                        // Render opening hours for a closed day
                                        <span className="text-sm text-slate-400 italic">Closed</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Facility usage guidelines */}
                {facility.usageGuidelines.length > 0 && (
                    <div>
                        {/* Section title */}
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            Usage Guidelines
                        </p>
                        {/* Render usage guidelines */}
                        <ul className="space-y-1.5">
                            {facility.usageGuidelines.map((g, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${cfg.bg}`} />
                                    {g}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}
