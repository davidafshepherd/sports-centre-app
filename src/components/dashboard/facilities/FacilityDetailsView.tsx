"use client"

import { Fragment, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { getFacilityById } from "@/lib/facilities"
import { createBookingRequest, getBookingRequestsForMember } from "@/lib/bookings"
import type { BookingRequest } from "@/types/booking"
import type { Facility, FacilityCategory } from "@/types/facility"
import { CATEGORY_LABELS } from "@/types/facility"
import {
    ArrowLeft, Check, Clock, Users, MapPin,
    Activity, Dumbbell, Waves, Trophy, Target, Layers,
    CheckCircle2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

// ── Category config ────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<FacilityCategory, {
    icon: LucideIcon; bg: string; text: string; lightBg: string; ring: string; image: string
}> = {
    badminton: { icon: Activity, bg: "bg-rose-500",    text: "text-rose-600",    lightBg: "bg-rose-50",    ring: "ring-rose-200",    image: "/facilities/badminton.jpg" },
    football:  { icon: Trophy,   bg: "bg-emerald-500", text: "text-emerald-600", lightBg: "bg-emerald-50", ring: "ring-emerald-200", image: "/facilities/football.jpg" },
    squash:    { icon: Layers,   bg: "bg-orange-500",  text: "text-orange-600",  lightBg: "bg-orange-50",  ring: "ring-orange-200",  image: "/facilities/squash.jpg" },
    tennis:    { icon: Target,   bg: "bg-yellow-500",  text: "text-yellow-700",  lightBg: "bg-yellow-50",  ring: "ring-yellow-200",  image: "/facilities/tennis.jpg" },
    gym:       { icon: Dumbbell, bg: "bg-violet-500",  text: "text-violet-600",  lightBg: "bg-violet-50",  ring: "ring-violet-200",  image: "/facilities/gym.jpg" },
    swimming:  { icon: Waves,    bg: "bg-cyan-500",    text: "text-cyan-600",    lightBg: "bg-cyan-50",    ring: "ring-cyan-200",    image: "/facilities/swimming.jpg" },
}

// ── Opening hours helpers ──────────────────────────────────────────────────

const JS_DAYS  = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"] as const
const ORD_DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const
const DAY_LABELS: Record<string, string> = {
    monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
    friday: "Fri", saturday: "Sat", sunday: "Sun",
}

type DayKey = typeof ORD_DAYS[number]

const todayKey = JS_DAYS[new Date().getDay()] as DayKey

// ── Booking request helpers ────────────────────────────────────────────────

const ACTIVE_REQUEST_STATUS = ["pending", "approved", "alternative_suggested"] as const

const ACTIVE_STATUS_UI: Record<string, { title: string; before: string; linkText: string; after: string; style: string }> = {
    pending: {
        title: "Request pending",
        before: "Your ",
        linkText: "request",
        after: " is awaiting staff review. You'll be notified once it has been reviewed.",
        style: "bg-amber-50 border-amber-200",
    },
    approved: {
        title: "Request approved",
        before: "Your request was approved. ",
        linkText: "Select a time slot in Bookings",
        after: " to confirm your booking.",
        style: "bg-green-50 border-green-200",
    },
    alternative_suggested: {
        title: "Alternative suggested",
        before: "Staff has suggested an alternative facility. ",
        linkText: "Respond in Bookings",
        after: ".",
        style: "bg-blue-50 border-blue-200",
    },
}

// ── Steps indicator ────────────────────────────────────────────────────────

function StepsIndicator({ step }: { step: 1 | 2 | 3 }) {
    const STEPS = [
        { label: "Describe", sub: "Fill out below" },
        { label: "Staff review", sub: "1–2 days" },
        { label: "Select slot", sub: "After approval" },
    ]
    return (
        <div className="flex items-start">
            {STEPS.map((s, i) => {
                const num    = i + 1
                const done   = num < step
                const active = num === step
                return (
                    <Fragment key={i}>
                        <div className="flex flex-col items-center">
                            <div className={[
                                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                done   ? "bg-green-500 text-white" :
                                active ? "bg-sky-600 text-white"   :
                                         "bg-slate-100 text-slate-400",
                            ].join(" ")}>
                                {done ? <Check className="w-3.5 h-3.5" /> : num}
                            </div>
                            <p className={[
                                "text-xs mt-1 text-center whitespace-nowrap",
                                done   ? "text-green-600 font-medium" :
                                active ? "text-sky-600 font-medium"   : "text-slate-400",
                            ].join(" ")}>{s.label}</p>
                            <p className={[
                                "text-xs text-center whitespace-nowrap",
                                active ? "text-sky-400" : "text-slate-300",
                            ].join(" ")}>{s.sub}</p>
                        </div>
                        {i < 2 && <div className="flex-1 h-px bg-slate-200 mx-2 mt-3.5" />}
                    </Fragment>
                )
            })}
        </div>
    )
}

// ── Booking request form (members) ─────────────────────────────────────────

const bookingSchema = z.object({
    activityDescription: z.string().min(3, "Please describe your activity"),
})

type BookingForm = z.infer<typeof bookingSchema>

function BookingRequestForm({ facility, onDone }: { facility: Facility; onDone: () => void }) {
    const { user, userProfile } = useAuth()
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess]       = useState(false)
    const [error, setError]           = useState("")

    const { register, handleSubmit, formState: { errors } } = useForm<BookingForm>({
        resolver: zodResolver(bookingSchema),
    })

    async function onSubmit(data: BookingForm) {
        if (!user || !userProfile) return
        setSubmitting(true)
        setError("")
        try {
            await createBookingRequest({
                memberId:            user.uid,
                memberName:          `${userProfile.firstName} ${userProfile.lastName}`,
                memberEmail:         user.email ?? "",
                facilityId:          facility.id,
                facilityName:        facility.name,
                activityDescription: data.activityDescription,
            })
            setSuccess(true)
        } catch {
            setError("Failed to submit request. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    if (success) {
        return (
            <div className="space-y-5">
                <StepsIndicator step={2} />
                <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="font-semibold text-slate-900">Request submitted!</p>
                    <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                        Staff will review your request within 1–2 days. Once approved, go to Bookings to pick a time slot.
                    </p>
                    <button onClick={onDone}
                        className="mt-4 px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors cursor-pointer">
                        Done
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            <StepsIndicator step={1} />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        What will you be doing?
                    </label>
                    <textarea {...register("activityDescription")} rows={3}
                        placeholder="e.g. Casual badminton session with friends, practising serves and rallies."
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none placeholder:text-slate-400" />
                    {errors.activityDescription && (
                        <p className="text-xs text-red-600 mt-1">{errors.activityDescription.message}</p>
                    )}
                </div>
                <button type="submit" disabled={submitting}
                    className="w-full py-3 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 disabled:opacity-60 transition-colors shadow-sm cursor-pointer">
                    {submitting ? "Submitting…" : "Submit Request"}
                </button>
            </form>
        </div>
    )
}

// ── Root export ────────────────────────────────────────────────────────────

export default function FacilityDetailsView({ facilityId }: { facilityId: string }) {
    const { user, userProfile } = useAuth()
    const router = useRouter()
    const role = userProfile?.role

    const [facility, setFacility]               = useState<Facility | null>(null)
    const [loading, setLoading]                 = useState(true)
    const [bookingModalOpen, setBookingModalOpen] = useState(false)
    const [bookingKey, setBookingKey]           = useState(0)
    const [activeRequest, setActiveRequest]     = useState<BookingRequest | null | undefined>(undefined)

    useEffect(() => {
        getFacilityById(facilityId).then(f => {
            if (!f) { router.replace("/facilities"); return }
            setFacility(f)
            setLoading(false)
        })
    }, [facilityId, router])

    useEffect(() => {
        if (!user || role !== "member") return
        getBookingRequestsForMember(user.uid).then(requests => {
            const found = requests.find(
                r => r.facilityId === facilityId &&
                    (ACTIVE_REQUEST_STATUS as readonly string[]).includes(r.status),
            )
            setActiveRequest(found ?? null)
        })
    }, [user, facilityId, role])

    function refreshActiveRequest() {
        if (!user) return
        getBookingRequestsForMember(user.uid).then(requests => {
            const found = requests.find(
                r => r.facilityId === facilityId &&
                    (ACTIVE_REQUEST_STATUS as readonly string[]).includes(r.status),
            )
            setActiveRequest(found ?? null)
        })
    }

    if (loading) return (
        <div className="space-y-4 animate-pulse max-w-2xl">
            <div className="h-56 bg-slate-200 rounded-2xl" />
            <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
    )

    if (!facility) return null

    const cfg = CATEGORY_CONFIG[facility.category]
    const CategoryIcon = cfg.icon

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            {/* Facility info card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Photo header */}
                <div className="relative h-52 overflow-hidden bg-slate-100">
                    <Image src={cfg.image} alt={CATEGORY_LABELS[facility.category]}
                        fill sizes="(min-width: 672px) 672px, 100vw"
                        className="object-cover" priority />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-black/10" />

                    {/* Back button overlay */}
                    <Link href="/facilities"
                        className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-medium text-white bg-black/30 backdrop-blur-sm hover:bg-black/50 px-3 py-1.5 rounded-full transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Facilities
                    </Link>

                    {/* Bottom metadata */}
                    <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm">
                                <CategoryIcon className={`w-5 h-5 ${cfg.text}`} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white leading-tight drop-shadow">
                                    {facility.name}
                                </h1>
                                <p className="flex items-center gap-1 text-sm text-white/80 mt-0.5">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" /> {facility.location}
                                </p>
                                <p className="flex items-center gap-1 text-sm text-white/80 mt-0.5">
                                    <Users className="w-3.5 h-3.5 shrink-0" /> {facility.maxCapacity} capacity
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm ${cfg.text}`}>
                                {CATEGORY_LABELS[facility.category]}
                            </span>
                            {!facility.isActive && (
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-sm text-white">
                                    Inactive
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Description */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{facility.description}</p>
                    </div>

                    {/* Opening hours */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> Opening Hours
                            </p>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {facility.slotDurationMins ?? 60} min slots
                            </span>
                        </div>
                        <div className="space-y-1">
                            {ORD_DAYS.map(day => {
                                const h = facility.openingHours[day as keyof typeof facility.openingHours]
                                const isToday = day === todayKey
                                return (
                                    <div key={day} className={[
                                        "flex items-center justify-between px-3 py-1.5 rounded-lg",
                                        isToday ? `${cfg.lightBg} ring-1 ring-inset ${cfg.ring}` : "",
                                    ].join(" ")}>
                                        <span className={`text-sm font-medium w-10 ${isToday ? cfg.text : "text-slate-600"}`}>
                                            {DAY_LABELS[day]}
                                        </span>
                                        {h ? (
                                            <span className={`text-sm ${isToday ? cfg.text : "text-slate-700"}`}>
                                                {h.open} – {h.close}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">Closed</span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Usage guidelines */}
                    {facility.usageGuidelines.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                Usage Guidelines
                            </p>
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

            {/* Member: booking section */}
            {role === "member" && (() => {
                if (!facility.isActive) return (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700">
                        This facility is currently inactive and cannot be booked.
                    </div>
                )
                if (activeRequest === undefined) return (
                    <div className="animate-pulse h-12 bg-slate-200 rounded-2xl" />
                )
                return (
                    <div className="space-y-2">
                        <button
                            disabled={!!activeRequest}
                            onClick={() => setBookingModalOpen(true)}
                            className={`w-full py-3 rounded-2xl text-sm font-semibold text-white transition-colors shadow-sm ${cfg.bg} hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}>
                            Request a Booking
                        </button>
                        {activeRequest && (
                            <p className="text-sm text-center text-slate-500">
                                {ACTIVE_STATUS_UI[activeRequest.status].before}
                                <Link href="/bookings" className="text-sky-900 hover:text-sky-800 underline">
                                    {ACTIVE_STATUS_UI[activeRequest.status].linkText}
                                </Link>
                                {ACTIVE_STATUS_UI[activeRequest.status].after}
                            </p>
                        )}
                    </div>
                )
            })()}

            {/* Booking request modal */}
            {bookingModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setBookingModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-slate-900">Request a Booking</h2>
                                <p className="text-sm text-slate-500 mt-0.5">{facility.name}</p>
                            </div>
                            <button
                                onClick={() => setBookingModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <div className="px-6 py-5">
                            <BookingRequestForm
                                key={bookingKey}
                                facility={facility}
                                onDone={() => {
                                    setBookingModalOpen(false)
                                    setBookingKey(k => k + 1)
                                    refreshActiveRequest()
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
