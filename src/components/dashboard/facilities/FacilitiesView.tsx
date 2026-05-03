"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { getFacilities } from "@/lib/facilities"
import type { Facility, FacilityCategory } from "@/types/facility"
import { CATEGORY_LABELS } from "@/types/facility"
import {
    Building2, Clock, Users, MapPin, ArrowRight,
    Activity, Dumbbell, Waves, Trophy, Target, Layers,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// ── Category config ────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<FacilityCategory, { icon: LucideIcon; bg: string; text: string; image: string }> = {
    badminton: { icon: Activity, bg: "bg-rose-50",    text: "text-rose-600",    image: "/facilities/badminton.jpg" },
    football:  { icon: Trophy,   bg: "bg-emerald-50", text: "text-emerald-600", image: "/facilities/football.jpg" },
    squash:    { icon: Layers,   bg: "bg-orange-50",  text: "text-orange-600",  image: "/facilities/squash.jpg" },
    tennis:    { icon: Target,   bg: "bg-yellow-50",  text: "text-yellow-700",  image: "/facilities/tennis.jpg" },
    gym:       { icon: Dumbbell, bg: "bg-violet-50",  text: "text-violet-600",  image: "/facilities/gym.jpg" },
    swimming:  { icon: Waves,    bg: "bg-cyan-50",    text: "text-cyan-600",    image: "/facilities/swimming.jpg" },
}

// ── Opening hours helpers ──────────────────────────────────────────────────

const JS_DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"] as const

function todayLabel(oh: Facility["openingHours"]): string {
    const day = JS_DAYS[new Date().getDay()] as keyof Facility["openingHours"]
    const h = oh[day]
    return h ? `${h.open}–${h.close}` : "Closed today"
}

// ── Facility card ──────────────────────────────────────────────────────────

function FacilityCard({ facility, priority = false }: {
    facility: Facility
    priority?: boolean
}) {
    const cfg = CATEGORY_CONFIG[facility.category]
    const Icon = cfg.icon

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            {/* Photo header */}
            <div className="relative h-40 overflow-hidden bg-slate-100">
                <Image src={cfg.image} alt={CATEGORY_LABELS[facility.category]}
                    fill sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover" priority={priority} />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                    <div className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm">
                        <Icon className={`w-4 h-4 ${cfg.text}`} />
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm ${cfg.text}`}>
                        {CATEGORY_LABELS[facility.category]}
                    </span>
                </div>
            </div>

            {/* Card body */}
            <div className="px-5 pt-4 pb-3 flex-1 flex flex-col gap-2">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{facility.name}</h3>
                    <p className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        {facility.location}
                    </p>
                </div>

                <p className="text-sm text-slate-600 line-clamp-2 flex-1">{facility.description}</p>

                <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {todayLabel(facility.openingHours)}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {facility.maxCapacity} capacity
                    </span>
                </div>
            </div>

            {/* Card footer */}
            <div className="px-5 pb-5">
                <Link href={`/facilities/${facility.id}`}
                    className="flex w-full items-center justify-center gap-2 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition-colors">
                    View & Request <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    )
}

// ── Root export ────────────────────────────────────────────────────────────

export default function FacilitiesView() {
    const [facilities, setFacilities] = useState<Facility[]>([])
    const [loading, setLoading]       = useState(true)

    useEffect(() => {
        getFacilities().then(data => {
            setFacilities(data)
            setLoading(false)
        })
    }, [])

    if (loading) return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
            {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-slate-200 rounded-2xl" />)}
        </div>
    )

    return (
        <div className="space-y-6">
            <p className="text-sm text-slate-500">{facilities.length} available</p>

            {facilities.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                    <p className="font-medium text-slate-400">No facilities found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {facilities.map((f, i) => (
                        <FacilityCard key={f.id} facility={f} priority={i < 3} />
                    ))}
                </div>
            )}
        </div>
    )
}
