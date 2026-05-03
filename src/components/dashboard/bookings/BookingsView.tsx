"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/providers/AuthProvider"
import {
    getBookingsForMember, getBookingRequestsForMember,
    getBookingsForStaff, getBookingRequestsForStaff,
    getBookingsForFacility, getUpcomingBookingsForFacility,
    approveBookingRequest, rejectBookingRequest, suggestAlternative,
    cancelBooking, markBookingComplete,
    acceptAlternativeSuggestion, rejectAlternativeSuggestion,
    confirmBookingSlot, cancelBookingRequest,
} from "@/lib/bookings"
import { getFacilities, getFacilityById } from "@/lib/facilities"
import type { Booking, BookingRequest } from "@/types/booking"
import type { Facility } from "@/types/facility"
import {
    formatSlot,
    bookingStatusColour, bookingStatusLabel,
    requestStatuscolour, requestStatusLabel,
    getMinBookingDate, getMaxBookingDate,
} from "@/lib/utils"
import {
    CalendarDays, CheckCircle, XCircle, Repeat,
    Clock, MapPin, CheckCircle2,
} from "lucide-react"

// ── Category config ────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { image: string; accent: string; label: string }> = {
    badminton: { image: "/facilities/badminton.jpg", accent: "bg-rose-500",    label: "Badminton" },
    football:  { image: "/facilities/football.jpg",  accent: "bg-emerald-500", label: "Football"  },
    squash:    { image: "/facilities/squash.jpg",    accent: "bg-orange-500",  label: "Squash"    },
    tennis:    { image: "/facilities/tennis.jpg",    accent: "bg-yellow-500",  label: "Tennis"    },
    gym:       { image: "/facilities/gym.jpg",       accent: "bg-violet-500",  label: "Gym"       },
    swimming:  { image: "/facilities/swimming.jpg",  accent: "bg-cyan-500",    label: "Swimming"  },
}

// ── Slot helpers ───────────────────────────────────────────────────────────

function parseTimeToMins(t: string): number {
    const [h, m] = t.split(":").map(Number)
    return h * 60 + (m || 0)
}

// ── Shared UI helpers ──────────────────────────────────────────────────────

function Badge({ label, colour }: { label: string; colour: string }) {
    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${colour}`}>
            {label}
        </span>
    )
}

function Tabs({ tabs, active, onChange }: {
    tabs: { id: string; label: string; count?: number }[]
    active: string
    onChange: (id: string) => void
}) {
    return (
        <div className="flex gap-1 border-b border-slate-200 mb-5">
            {tabs.map(tab => (
                <button key={tab.id} onClick={() => onChange(tab.id)}
                    className={[
                        "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
                        active === tab.id
                            ? "border-sky-600 text-sky-600"
                            : "border-transparent text-slate-500 hover:text-slate-700",
                    ].join(" ")}>
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                        <span className="ml-1.5 bg-sky-100 text-sky-700 text-xs px-1.5 py-0.5 rounded-full">
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    )
}

// CardPhoto is used in modals only (full-width top image)
function CardPhoto({ category, name }: { category?: string; name: string }) {
    const cfg = category ? CATEGORY_CONFIG[category] : null
    return (
        <div className="relative h-28 bg-slate-200 overflow-hidden">
            {cfg && (
                <Image src={cfg.image} alt={name} fill
                    className="object-cover" sizes="(min-width: 672px) 672px, 100vw" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 to-black/10" />
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex items-end justify-between gap-3">
                <p className="text-white font-semibold text-sm leading-tight drop-shadow truncate">
                    {name}
                </p>
                {cfg && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full text-white shrink-0 ${cfg.accent}`}>
                        {cfg.label}
                    </span>
                )}
            </div>
        </div>
    )
}

// SideThumb is used in list cards (left-side portrait image)
function SideThumb({ category, name }: { category?: string; name: string }) {
    const cfg = category ? CATEGORY_CONFIG[category] : null
    return (
        <div className="relative w-48 self-stretch bg-slate-100 shrink-0">
            {cfg && (
                <Image src={cfg.image} alt={name} fill className="object-cover" sizes="384px" quality={90} loading="eager" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
        </div>
    )
}

function formatCardDate(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number)
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "short",
    })
}

function MemberAvatar({ name }: { name: string }) {
    const parts = name.trim().split(" ")
    const initials = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
    return (
        <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
        </div>
    )
}

// ── Slot picker ────────────────────────────────────────────────────────────

const JS_DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"] as const

function getSlotsForFacilityDate(facility: Facility, dateStr: string): number[] {
    if (!dateStr) return []
    const [y, m, d] = dateStr.split("-").map(Number)
    const day = JS_DAYS[new Date(y, m - 1, d).getDay()]
    const h = facility.openingHours[day as keyof typeof facility.openingHours]
    if (!h) return []
    const openMins  = parseTimeToMins(h.open)
    const closeMins = parseTimeToMins(h.close)
    const duration  = facility.slotDurationMins ?? 60
    const slots: number[] = []
    for (let t = openMins; t + duration <= closeMins; t += duration) slots.push(t)
    return slots
}

function SlotGrid({ slots, booked, selected, loading, onSelect, slotDurationMins = 60 }: {
    slots: number[]
    booked: number[]
    selected: number
    loading: boolean
    onSelect: (slot: number) => void
    slotDurationMins?: number
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
                Time Slot {loading && <span className="text-slate-400 font-normal">(loading…)</span>}
            </label>
            <div className="grid grid-cols-4 gap-2">
                {slots.map(slot => {
                    const isBooked = booked.includes(slot)
                    const isSel    = selected === slot
                    return (
                        <button key={slot} type="button" disabled={isBooked}
                            onClick={() => onSelect(slot)}
                            className={[
                                "py-1.5 text-xs rounded-lg border font-medium transition-colors",
                                isBooked
                                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50"
                                    : isSel
                                        ? "bg-sky-600 text-white border-sky-600 cursor-pointer"
                                        : "bg-white text-slate-700 border-slate-300 hover:border-sky-400 hover:bg-sky-50 cursor-pointer",
                            ].join(" ")}>
                            {formatSlot(slot, slotDurationMins).split("–")[0].trim()}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// ── Confirm slot modal (member) ────────────────────────────────────────────

function ConfirmSlotModal({ request, onClose, onDone }: {
    request: BookingRequest
    onClose: () => void
    onDone: () => void
}) {
    const { user } = useAuth()
    const [facility, setFacility]         = useState<Facility | null>(null)
    const [date, setDate]                 = useState("")
    const [slotStart, setSlotStart]       = useState(-1)
    const [existingBookings, setExistingBookings] = useState<Booking[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [submitting, setSubmitting]     = useState(false)
    const [error, setError]               = useState("")

    useEffect(() => {
        getFacilityById(request.facilityId).then(f => setFacility(f))
    }, [request.facilityId])

    const today       = new Date().toISOString().split("T")[0]
    const nowMins     = new Date().getHours() * 60 + new Date().getMinutes()
    const slotDurMins = facility?.slotDurationMins ?? 60
    const maxCap      = facility?.maxCapacity ?? 1

    const allSlots = facility ? getSlotsForFacilityDate(facility, date) : []

    // Hide slots that have already started today
    const visibleSlots = date === today
        ? allSlots.filter(slot => slot >= nowMins)
        : allSlots

    // Slots unavailable due to capacity or already booked by this member
    const slotCountMap = existingBookings.reduce<Record<number, number>>((acc, b) => {
        acc[b.slotStart] = (acc[b.slotStart] ?? 0) + 1
        return acc
    }, {})
    const unavailableSlots = [...new Set([
        ...existingBookings.filter(b => (slotCountMap[b.slotStart] ?? 0) >= maxCap).map(b => b.slotStart),
        ...existingBookings.filter(b => b.memberId === user?.uid).map(b => b.slotStart),
    ])]

    useEffect(() => {
        if (!date) return
        setSlotStart(-1)
        setLoadingSlots(true)
        getBookingsForFacility(request.facilityId, date)
            .then(bookings => setExistingBookings(bookings))
            .finally(() => setLoadingSlots(false))
    }, [request.facilityId, date])

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!user || slotStart === -1) return
        setSubmitting(true)
        setError("")
        try {
            await confirmBookingSlot(request.id, request, user.uid, date, slotStart, slotDurMins)
            onDone()
        } catch {
            setError("Failed to confirm booking. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <CardPhoto category={facility?.category} name={request.facilityName} />
                <div className="px-6 pt-4 pb-1">
                    <h2 className="font-semibold text-slate-900">Select a Time Slot</h2>
                </div>
                <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
                    {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                        <input type="date" required value={date}
                            min={getMinBookingDate()} max={getMaxBookingDate()}
                            onChange={e => setDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer" />
                    </div>
                    {date && facility && visibleSlots.length === 0 && (
                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-amber-800">
                                    {allSlots.length === 0 ? "Facility closed" : "No slots left today"}
                                </p>
                                <p className="text-xs text-amber-600 mt-0.5">
                                    {allSlots.length === 0
                                        ? "This facility is closed on the selected date. Try a different day."
                                        : "All time slots for today have passed or are taken. Try a future date."}
                                </p>
                            </div>
                        </div>
                    )}
                    {date && facility && visibleSlots.length > 0 && (
                        <SlotGrid slots={visibleSlots} booked={unavailableSlots} selected={slotStart}
                            loading={loadingSlots} onSelect={setSlotStart}
                            slotDurationMins={slotDurMins} />
                    )}
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting || slotStart === -1 || !date}
                            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                            {submitting ? "Confirming…" : "Confirm Booking"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ── Alternative suggestion modal (staff) ──────────────────────────────────

function getNext7Dates(): string[] {
    const dates: string[] = []
    const now = new Date()
    for (let i = 0; i < 7; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
        dates.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`)
    }
    return dates
}

function getTotalSlots(facility: Facility, dates: string[]): number {
    const duration = facility.slotDurationMins ?? 60
    return dates.reduce((total, dateStr) => {
        const [y, m, d] = dateStr.split("-").map(Number)
        const dayName = JS_DAYS[new Date(y, m - 1, d).getDay()]
        const h = facility.openingHours[dayName as keyof typeof facility.openingHours]
        if (!h) return total
        return total + Math.floor((parseTimeToMins(h.close) - parseTimeToMins(h.open)) / duration)
    }, 0)
}

function availabilityCategory(booked: number, total: number): { label: string; colour: string } {
    if (total === 0) return { label: "Closed",  colour: "bg-slate-100 text-slate-500" }
    const pct = booked / total
    if (pct < 0.3)  return { label: "High",   colour: "bg-green-100 text-green-700" }
    if (pct < 0.7)  return { label: "Medium", colour: "bg-amber-100 text-amber-700" }
    return          { label: "Low",    colour: "bg-red-100   text-red-700"   }
}

function AlternativeSuggestionModal({ request, facilities, onClose, onDone }: {
    request: BookingRequest
    facilities: Facility[]
    onClose: () => void
    onDone: () => void
}) {
    const { user } = useAuth()
    const [selectedFacilityId, setSelectedFacilityId] = useState("")
    const [note, setNote] = useState("")
    const [availability, setAvailability] = useState<Record<string, { booked: number; total: number }>>({})
    const [loadingAvailability, setLoadingAvailability] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")

    const requestedCategory = facilities.find(f => f.id === request.facilityId)?.category
    const sameCategoryFacilities = facilities.filter(
        f => f.category === requestedCategory && f.isActive && f.id !== request.facilityId
    )

    useEffect(() => {
        const dates = getNext7Dates()
        const targets = facilities.filter(
            f => f.category === facilities.find(x => x.id === request.facilityId)?.category && f.isActive
        )
        if (targets.length === 0) { setLoadingAvailability(false); return }
        Promise.all(
            targets.map(f =>
                getUpcomingBookingsForFacility(f.id).then(bookings => {
                    const booked = bookings.filter(b => dates.includes(b.date)).length
                    const total  = getTotalSlots(f, dates)
                    return [f.id, { booked, total }] as const
                })
            )
        ).then(entries => {
            setAvailability(Object.fromEntries(entries))
            setLoadingAvailability(false)
        })
    }, [request.facilityId, facilities])

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!user || !selectedFacilityId) return
        const selected = sameCategoryFacilities.find(f => f.id === selectedFacilityId)!
        setSubmitting(true)
        setError("")
        try {
            await suggestAlternative(request.id, request, user.uid, {
                facilityId:   selectedFacilityId,
                facilityName: selected.name,
                note,
            })
            onDone()
        } catch {
            setError("Failed to send suggestion. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
                <CardPhoto category={requestedCategory} name={request.facilityName} />
                <div className="px-6 pt-4 pb-1 flex-shrink-0">
                    <h2 className="font-semibold text-slate-900">Suggest Alternative Facility</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{request.memberName} · {request.activityDescription}</p>
                </div>
                <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4 overflow-y-auto flex-1">
                    {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">
                            Availability — next 7 days
                            {loadingAvailability && <span className="ml-1 font-normal text-slate-400">(loading…)</span>}
                        </p>
                        <div className="space-y-2">
                            {sameCategoryFacilities.map(f => {
                                const avail = availability[f.id]
                                const { label, colour } = avail
                                    ? availabilityCategory(avail.booked, avail.total)
                                    : { label: "", colour: "" }
                                const isSelected = selectedFacilityId === f.id
                                return (
                                    <button key={f.id} type="button"
                                        onClick={() => setSelectedFacilityId(f.id)}
                                        className={[
                                            "w-full text-left px-4 py-3 rounded-xl border transition-colors cursor-pointer",
                                            isSelected
                                                ? "border-sky-500 bg-sky-50"
                                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                                        ].join(" ")}>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-900">{f.name}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />{f.location}
                                                </p>
                                            </div>
                                            {avail && (
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colour}`}>{label}</span>
                                                    <span className="text-xs text-slate-400">{avail.total - avail.booked}/{avail.total} slots</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Note (optional)</label>
                        <textarea rows={2} value={note}
                            placeholder="Reason for the alternative…"
                            onChange={e => setNote(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting || !selectedFacilityId}
                            className="flex-1 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 disabled:hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                            {submitting ? "Sending…" : "Send Suggestion"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ── Reject/note modal ──────────────────────────────────────────────────────

function RejectModal({ title, placeholder, onClose, onConfirm }: {
    title: string
    placeholder: string
    onClose: () => void
    onConfirm: (note: string) => Promise<void>
}) {
    const [note, setNote]         = useState("")
    const [submitting, setSubmitting] = useState(false)
    async function handleConfirm() {
        setSubmitting(true)
        await onConfirm(note)
    }
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
                <div className="px-6 py-5 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-900">{title}</h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
                    <div className="flex gap-3">
                        <button onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer">
                            Cancel
                        </button>
                        <button onClick={handleConfirm} disabled={submitting}
                            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                            {submitting ? "Confirming…" : "Confirm"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Member bookings tab ────────────────────────────────────────────────────

function MemberBookingsTab() {
    const { user } = useAuth()
    const [bookings, setBookings]   = useState<Booking[]>([])
    const [requests, setRequests]   = useState<BookingRequest[]>([])
    const [facilityMap, setFacilityMap] = useState<Record<string, Facility>>({})
    const [tab, setTab]             = useState("requests")
    const [loading, setLoading]     = useState(true)
    const [cancelling, setCancelling]           = useState<string | null>(null)
    const [cancellingRequest, setCancellingRequest] = useState<string | null>(null)
    const [responding, setResponding]           = useState<string | null>(null)
    const [confirmSlotTarget, setConfirmSlotTarget] = useState<BookingRequest | null>(null)

    async function load() {
        if (!user) return
        const [b, r, facilities] = await Promise.all([
            getBookingsForMember(user.uid),
            getBookingRequestsForMember(user.uid),
            getFacilities(),
        ])
        setBookings(b)
        setRequests(r)
        setFacilityMap(Object.fromEntries(facilities.map(f => [f.id, f])))
        setLoading(false)
    }

    useEffect(() => { load() }, [user])

    async function handleCancel(booking: Booking) {
        if (!user) return
        setCancelling(booking.id)
        await cancelBooking(booking.id, booking, "member")
        setCancelling(null)
        load()
    }

    async function handleCancelRequest(req: BookingRequest) {
        setCancellingRequest(req.id)
        await cancelBookingRequest(req.id)
        setCancellingRequest(null)
        load()
    }

    async function handleAcceptAlternative(req: BookingRequest) {
        setResponding(req.id)
        await acceptAlternativeSuggestion(req.id, req)
        setResponding(null)
        load()
    }

    async function handleRejectAlternative(req: BookingRequest) {
        setResponding(req.id)
        await rejectAlternativeSuggestion(req.id)
        setResponding(null)
        load()
    }

    const actionableRequests = requests.filter(r =>
        ["pending", "approved", "alternative_suggested"].includes(r.status),
    )
    const rejectedRequests  = requests.filter(r => r.status === "rejected")
    const visibleRequests   = [...actionableRequests, ...rejectedRequests]
    const upcomingBookings  = bookings.filter(b => b.status === "upcoming")
    const historyBookings   = bookings
        .filter(b => b.status !== "upcoming")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const tabs = [
        { id: "requests", label: "Requests", count: actionableRequests.length },
        { id: "upcoming", label: "Upcoming", count: upcomingBookings.length },
        { id: "history",  label: "History" },
    ]

    if (loading) return <LoadingSkeleton />

    return (
        <>
            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            {tab === "requests" && (
                <div className="space-y-3">
                    {visibleRequests.length === 0
                        ? <EmptyState icon={<CalendarDays className="w-10 h-10 text-slate-300" />}
                            message="No booking requests yet."
                            action={{ label: "Browse facilities", href: "/facilities" }} />
                        : visibleRequests.map(req => {
                            const category = facilityMap[req.facilityId]?.category
                            const cfg = category ? CATEGORY_CONFIG[category] : null
                            return (
                                <div key={req.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex">
                                    <SideThumb category={category} name={req.facilityName} />
                                    <div className="flex-1 min-w-0 flex flex-col">

                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-100">
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 truncate leading-tight">{req.facilityName}</p>
                                                {facilityMap[req.facilityId]?.location && (
                                                    <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                        {facilityMap[req.facilityId].location}
                                                    </p>
                                                )}
                                                {cfg && (
                                                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full text-white ${cfg.accent}`}>
                                                        {cfg.label}
                                                    </span>
                                                )}
                                            </div>
                                            <Badge label={requestStatusLabel(req.status)} colour={requestStatuscolour(req.status)} />
                                        </div>

                                        {/* Body */}
                                        <div className="px-4 py-3 flex-1 space-y-2.5">
                                            <div className="bg-slate-100 rounded-xl px-3 py-2.5">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Intended Activity</p>
                                                <p className="text-sm text-slate-700 leading-snug">{req.activityDescription}</p>
                                            </div>

                                            {req.status === "approved" && (
                                                <div className="flex items-start gap-2.5 border-l-4 border-emerald-500 bg-emerald-50 rounded-r-xl px-3 py-2.5">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    <p className="text-sm text-emerald-800">
                                                        <span className="font-semibold">Approved —</span> select a time slot to confirm your booking.
                                                    </p>
                                                </div>
                                            )}

                                            {req.status === "alternative_suggested" && (
                                                <div className="border-l-4 border-sky-500 bg-sky-50 rounded-r-xl px-3 py-2.5 space-y-1.5">
                                                    <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">Alternative Suggested</p>
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs text-sky-800"><span className="font-semibold">Facility:</span> {req.suggestedFacilityName}</p>
                                                        {req.reviewNote
                                                            ? <p className="text-xs text-sky-800"><span className="font-semibold">Reason:</span> {req.reviewNote}</p>
                                                            : <p className="text-xs text-sky-400 italic">No reason provided.</p>
                                                        }
                                                    </div>
                                                </div>
                                            )}

                                            {req.status === "rejected" && (
                                                <div className="flex items-start gap-2.5 border-l-4 border-red-500 bg-red-50 rounded-r-xl px-3 py-2.5">
                                                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                    <p className="text-sm text-red-800">
                                                        <span className="font-semibold">Declined{req.reviewNote ? " —" : "."}</span>
                                                        {req.reviewNote && ` ${req.reviewNote}`}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        {req.status === "approved" && (
                                            <div className="px-4 pb-4 pt-1 flex items-center justify-between gap-3 border-t border-slate-100">
                                                <button onClick={() => setConfirmSlotTarget(req)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer">
                                                    <CalendarDays className="w-4 h-4" /> Select a Time Slot
                                                </button>
                                                <button onClick={() => handleCancelRequest(req)} disabled={cancellingRequest === req.id}
                                                    className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                                    {cancellingRequest === req.id ? "Cancelling…" : "Cancel request"}
                                                </button>
                                            </div>
                                        )}

                                        {req.status === "alternative_suggested" && (
                                            <div className="px-4 pb-4 pt-1 flex gap-2 border-t border-slate-100">
                                                <button onClick={() => handleAcceptAlternative(req)} disabled={responding === req.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                                    <CheckCircle className="w-4 h-4" /> Accept
                                                </button>
                                                <button onClick={() => handleRejectAlternative(req)} disabled={responding === req.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                                    <XCircle className="w-4 h-4" /> Decline
                                                </button>
                                            </div>
                                        )}

                                        {req.status === "pending" && (
                                            <div className="px-4 pb-4 pt-1 border-t border-slate-100 flex justify-end">
                                                <button onClick={() => handleCancelRequest(req)} disabled={cancellingRequest === req.id}
                                                    className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                                    {cancellingRequest === req.id ? "Cancelling…" : "Cancel request"}
                                                </button>
                                            </div>
                                        )}

                                        {req.status === "rejected" && (
                                            <div className="px-4 pb-4 pt-1 border-t border-slate-100 flex justify-end">
                                                <button onClick={() => handleCancelRequest(req)} disabled={cancellingRequest === req.id}
                                                    className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                                    {cancellingRequest === req.id ? "Discarding…" : "Discard"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            )}

            {tab === "upcoming" && (
                <div className="space-y-3">
                    {upcomingBookings.length === 0
                        ? <EmptyState icon={<CalendarDays className="w-10 h-10 text-slate-300" />}
                            message="No upcoming bookings."
                            action={{ label: "Browse facilities", href: "/facilities" }} />
                        : upcomingBookings.map(b => {
                            const category = facilityMap[b.facilityId]?.category
                            const cfg = category ? CATEGORY_CONFIG[category] : null
                            return (
                                <div key={b.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex">
                                    <SideThumb category={category} name={b.facilityName} />
                                    <div className="flex-1 min-w-0 flex flex-col">

                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-100">
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 truncate leading-tight">{b.facilityName}</p>
                                                {facilityMap[b.facilityId]?.location && (
                                                    <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                        {facilityMap[b.facilityId].location}
                                                    </p>
                                                )}
                                                {cfg && (
                                                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full text-white ${cfg.accent}`}>
                                                        {cfg.label}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-500 text-white whitespace-nowrap shrink-0">Upcoming</span>
                                        </div>

                                        {/* Body */}
                                        <div className="px-4 py-3 flex-1 space-y-2.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-700">
                                                    <CalendarDays className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    {formatCardDate(b.date)}
                                                </span>
                                                <span className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-700">
                                                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    {formatSlot(b.slotStart, b.slotEnd - b.slotStart)}
                                                </span>
                                            </div>
                                            <div className="bg-slate-100 rounded-xl px-3 py-2.5">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Intended Activity</p>
                                                <p className="text-sm text-slate-700 leading-snug">{b.activityDescription}</p>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 flex justify-end">
                                            <button onClick={() => handleCancel(b)} disabled={cancelling === b.id}
                                                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                                {cancelling === b.id ? "Cancelling…" : "Cancel Booking"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            )}

            {tab === "history" && (
                <div className="space-y-3">
                    {historyBookings.length === 0
                        ? <EmptyState icon={<CalendarDays className="w-10 h-10 text-slate-300" />}
                            message="No booking history yet." />
                        : historyBookings.map(b => {
                            const category = facilityMap[b.facilityId]?.category
                            const cfg = category ? CATEGORY_CONFIG[category] : null
                            return (
                                <div key={b.id} className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex ${b.status === "cancelled" ? "opacity-60" : ""}`}>
                                    <SideThumb category={category} name={b.facilityName} />
                                    <div className="flex-1 min-w-0 flex flex-col">

                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-100">
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 truncate leading-tight">{b.facilityName}</p>
                                                {facilityMap[b.facilityId]?.location && (
                                                    <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                        {facilityMap[b.facilityId].location}
                                                    </p>
                                                )}
                                                {cfg && (
                                                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full text-white ${cfg.accent}`}>
                                                        {cfg.label}
                                                    </span>
                                                )}
                                            </div>
                                            <Badge label={bookingStatusLabel(b.status)} colour={bookingStatusColour(b.status)} />
                                        </div>

                                        {/* Body */}
                                        <div className="px-4 py-3 space-y-2.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-700">
                                                    <CalendarDays className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    {formatCardDate(b.date)}
                                                </span>
                                                <span className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-700">
                                                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    {formatSlot(b.slotStart, b.slotEnd - b.slotStart)}
                                                </span>
                                            </div>
                                            <div className="bg-slate-100 rounded-xl px-3 py-2.5">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Intended Activity</p>
                                                <p className="text-sm text-slate-700 leading-snug">{b.activityDescription}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            )}

            {confirmSlotTarget && (
                <ConfirmSlotModal
                    request={confirmSlotTarget}
                    onClose={() => setConfirmSlotTarget(null)}
                    onDone={() => { setConfirmSlotTarget(null); load() }}
                />
            )}
        </>
    )
}

// ── Staff bookings tab ─────────────────────────────────────────────────────

function StaffBookingsTab() {
    const { user } = useAuth()
    const [requests, setRequests]     = useState<BookingRequest[]>([])
    const [bookings, setBookings]     = useState<Booking[]>([])
    const [allFacilities, setAllFacilities] = useState<Facility[]>([])
    const [facilityAvailability, setFacilityAvailability] = useState<Record<string, { booked: number; total: number }>>({})
    const [tab, setTab]               = useState("pending")
    const [loading, setLoading]       = useState(true)
    const [rejectTarget, setRejectTarget]   = useState<BookingRequest | null>(null)
    const [altTarget, setAltTarget]         = useState<BookingRequest | null>(null)
    const [processing, setProcessing]       = useState<string | null>(null)

    async function load() {
        if (!user) return
        const [reqs, bkgs, facilities] = await Promise.all([
            getBookingRequestsForStaff(user.uid),
            getBookingsForStaff(user.uid),
            getFacilities(),
        ])
        setRequests(reqs)
        setBookings(bkgs)
        setAllFacilities(facilities)
        setLoading(false)

        const pendingFacilityIds = [...new Set(
            reqs.filter(r => r.status === "pending").map(r => r.facilityId)
        )]
        if (pendingFacilityIds.length === 0) return
        const dates = getNext7Dates()
        const facilityMap = Object.fromEntries(facilities.map(f => [f.id, f]))
        Promise.all(
            pendingFacilityIds.map(fid =>
                getUpcomingBookingsForFacility(fid).then(bookings => {
                    const facility = facilityMap[fid]
                    if (!facility) return null
                    const booked = bookings.filter(b => dates.includes(b.date)).length
                    const total  = getTotalSlots(facility, dates)
                    return [fid, { booked, total }] as const
                })
            )
        ).then(entries => {
            setFacilityAvailability(
                Object.fromEntries(entries.filter(Boolean) as [string, { booked: number; total: number }][])
            )
        })
    }

    useEffect(() => { load() }, [user])

    const facilityMap = Object.fromEntries(allFacilities.map(f => [f.id, f]))

    async function handleApprove(req: BookingRequest) {
        if (!user) return
        setProcessing(req.id)
        await approveBookingRequest(req.id, req, user.uid)
        setProcessing(null)
        load()
    }

    async function handleMarkComplete(booking: Booking) {
        if (!user) return
        setProcessing(booking.id)
        await markBookingComplete(booking.id, booking, user.uid)
        setProcessing(null)
        load()
    }

    const pending  = requests.filter(r => r.status === "pending")
    const sessions = bookings.filter(b => b.status === "upcoming")

    const tabs = [
        { id: "pending",  label: "Pending",  count: pending.length },
        { id: "sessions", label: "Sessions", count: sessions.length },
    ]

    if (loading) return <LoadingSkeleton />

    return (
        <>
            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            {tab === "pending" && (
                <div className="space-y-3">
                    {pending.length === 0
                        ? <EmptyState icon={<CheckCircle2 className="w-10 h-10 text-slate-300" />}
                            message="No pending requests." />
                        : pending.map(req => {
                            const category = facilityMap[req.facilityId]?.category
                            const cfg = category ? CATEGORY_CONFIG[category] : null
                            const avail = facilityAvailability[req.facilityId]
                            const { label: availLabel, colour: availColour } = avail
                                ? availabilityCategory(avail.booked, avail.total)
                                : { label: "", colour: "" }
                            const hasAlternatives = allFacilities.some(
                                f => f.category === category && f.isActive && f.id !== req.facilityId,
                            )
                            return (
                                <div key={req.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex">
                                    <SideThumb category={category} name={req.facilityName} />
                                    <div className="flex-1 min-w-0 flex flex-col">

                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-100">
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 truncate leading-tight">{req.facilityName}</p>
                                                {facilityMap[req.facilityId]?.location && (
                                                    <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                        {facilityMap[req.facilityId].location}
                                                    </p>
                                                )}
                                                {cfg && (
                                                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full text-white ${cfg.accent}`}>
                                                        {cfg.label}
                                                    </span>
                                                )}
                                            </div>
                                            <Badge label="Pending" colour="bg-amber-500 text-white" />
                                        </div>

                                        {/* Body */}
                                        <div className="px-4 py-3 flex-1 space-y-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <MemberAvatar name={req.memberName} />
                                                <div>
                                                    <p className="text-xs font-medium text-slate-400 leading-tight">Requested by</p>
                                                    <p className="text-sm font-semibold text-slate-800 leading-tight">{req.memberName}</p>
                                                </div>
                                            </div>
                                            <div className="bg-slate-100 rounded-xl px-3 py-2.5">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Intended Activity</p>
                                                <p className="text-sm text-slate-700 leading-snug">{req.activityDescription}</p>
                                            </div>
                                            {avail && (
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${availColour}`}>
                                                        {availLabel} availability
                                                    </span>
                                                    <p className="text-xs text-slate-400">
                                                        {avail.total - avail.booked}/{avail.total} slots free · next 7 days
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 flex gap-2">
                                            <button onClick={() => handleApprove(req)} disabled={processing === req.id}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                                <CheckCircle className="w-4 h-4" /> Approve
                                            </button>
                                            <button onClick={() => setRejectTarget(req)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer">
                                                <XCircle className="w-4 h-4" /> Decline
                                            </button>
                                            <button onClick={() => setAltTarget(req)}
                                                disabled={!hasAlternatives}
                                                title={!hasAlternatives ? "No alternative facilities available" : undefined}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 text-white rounded-xl text-sm font-medium hover:enabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                                <Repeat className="w-4 h-4" /> Suggest Alt
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            )}

            {tab === "sessions" && (
                <div className="space-y-3">
                    {sessions.length === 0
                        ? <EmptyState icon={<CalendarDays className="w-10 h-10 text-slate-300" />}
                            message="No upcoming sessions." />
                        : sessions.map(b => {
                            const category = facilityMap[b.facilityId]?.category
                            const cfg = category ? CATEGORY_CONFIG[category] : null
                            const today    = new Date().toISOString().split("T")[0]
                            const nowMins  = new Date().getHours() * 60 + new Date().getMinutes()
                            const canComplete = b.date < today || (b.date === today && nowMins >= b.slotStart)
                            return (
                                <div key={b.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex">
                                    <SideThumb category={category} name={b.facilityName} />
                                    <div className="flex-1 min-w-0 flex flex-col">

                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-100">
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 truncate leading-tight">{b.facilityName}</p>
                                                {facilityMap[b.facilityId]?.location && (
                                                    <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                        {facilityMap[b.facilityId].location}
                                                    </p>
                                                )}
                                                {cfg && (
                                                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full text-white ${cfg.accent}`}>
                                                        {cfg.label}
                                                    </span>
                                                )}
                                            </div>
                                            <Badge label="Upcoming" colour="bg-sky-500 text-white" />
                                        </div>

                                        {/* Body */}
                                        <div className="px-4 py-3 flex-1 space-y-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <MemberAvatar name={b.memberName} />
                                                <div>
                                                    <p className="text-xs font-medium text-slate-400 leading-tight">Member</p>
                                                    <p className="text-sm font-semibold text-slate-800 leading-tight">{b.memberName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-700">
                                                    <CalendarDays className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    {formatCardDate(b.date)}
                                                </span>
                                                <span className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-700">
                                                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    {formatSlot(b.slotStart, b.slotEnd - b.slotStart)}
                                                </span>
                                            </div>
                                            <div className="bg-slate-100 rounded-xl px-3 py-2.5">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Intended Activity</p>
                                                <p className="text-sm text-slate-700 leading-snug">{b.activityDescription}</p>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                                            <button onClick={() => handleMarkComplete(b)}
                                                disabled={processing === b.id || !canComplete}
                                                title={!canComplete ? "Session has not started yet" : undefined}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                                <CheckCircle2 className="w-4 h-4" /> Mark Complete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            )}

            {rejectTarget && (
                <RejectModal
                    title={`Decline request from ${rejectTarget.memberName}`}
                    placeholder="Reason for declining (optional)…"
                    onClose={() => setRejectTarget(null)}
                    onConfirm={async (note) => {
                        if (!user) return
                        await rejectBookingRequest(rejectTarget.id, rejectTarget, user.uid, note)
                        setRejectTarget(null)
                        load()
                    }}
                />
            )}

            {altTarget && (
                <AlternativeSuggestionModal
                    request={altTarget}
                    facilities={allFacilities}
                    onClose={() => setAltTarget(null)}
                    onDone={() => { setAltTarget(null); load() }}
                />
            )}
        </>
    )
}

// ── Empty state + skeleton ─────────────────────────────────────────────────

function EmptyState({ icon, message, action }: {
    icon: React.ReactNode
    message: string
    action?: { label: string; href: string }
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 flex flex-col items-center gap-3 text-center px-6">
            {icon}
            <p className="text-sm font-medium text-slate-500">{message}</p>
            {action && (
                <Link href={action.href}
                    className="text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors cursor-pointer">
                    {action.label} →
                </Link>
            )}
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex">
                    <div className="w-48 bg-slate-100 self-stretch shrink-0" />
                    <div className="flex-1 p-4 space-y-2.5">
                        <div className="h-4 w-2/3 bg-slate-100 rounded-full" />
                        <div className="h-3 w-1/3 bg-slate-100 rounded-full" />
                        <div className="h-3 w-1/2 bg-slate-100 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    )
}

// ── Root export ────────────────────────────────────────────────────────────

export default function BookingsView() {
    const { userProfile } = useAuth()
    if (!userProfile) return null
    return userProfile.role === "member" ? <MemberBookingsTab /> : <StaffBookingsTab />
}
