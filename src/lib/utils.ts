import type { BookingRequestStatus, BookingStatus } from "@/types/booking"
import type { ReportStatus } from "@/types/equipmentReport"

export function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    })
}

export function formatSlot(startMins: number, durationMins: number = 60): string {
    const fmt = (mins: number) => {
        const h = Math.floor(mins / 60) % 24
        const m = mins % 60
        const hour = h % 12 || 12
        const ampm = h < 12 ? "AM" : "PM"
        return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
    }
    return `${fmt(startMins)} – ${fmt(startMins + durationMins)}`
}

export function formatRelativeTime(isoStr: string): string {
    const diff = Date.now() - new Date(isoStr).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1)  return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7)  return `${days}d ago`
    return formatDate(isoStr.split("T")[0])
}

export function formatDateTime(isoStr: string): string {
    return new Date(isoStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export function getMinBookingDate(): string {
    return new Date().toISOString().split("T")[0]
}

export function getMaxBookingDate(): string {
    const d = new Date()
    d.setDate(d.getDate() + 60)
    return d.toISOString().split("T")[0]
}

// ── Status display helpers ─────────────────────────────────────────────────

export function requestStatusLabel(status: BookingRequestStatus): string {
    const labels: Record<BookingRequestStatus, string> = {
        pending:               "Pending",
        approved:              "Approved",
        confirmed:             "Confirmed",
        rejected:              "Declined",
        cancelled:             "Cancelled",
        alternative_suggested: "Alternative Suggested",
        alternative_accepted:  "Alternative Accepted",
        alternative_rejected:  "Alternative Declined",
    }
    return labels[status]
}

export function requestStatuscolour(status: BookingRequestStatus): string {
    const colours: Record<BookingRequestStatus, string> = {
        pending:               "bg-amber-500 text-white",
        approved:              "bg-emerald-500 text-white",
        confirmed:             "bg-sky-500 text-white",
        rejected:              "bg-red-500 text-white",
        cancelled:             "bg-slate-400 text-white",
        alternative_suggested: "bg-violet-500 text-white",
        alternative_accepted:  "bg-emerald-500 text-white",
        alternative_rejected:  "bg-red-500 text-white",
    }
    return colours[status]
}

export function bookingStatusLabel(status: BookingStatus): string {
    const labels: Record<BookingStatus, string> = {
        upcoming:  "Upcoming",
        completed: "Completed",
        cancelled: "Cancelled",
    }
    return labels[status]
}

export function bookingStatusColour(status: BookingStatus): string {
    const colours: Record<BookingStatus, string> = {
        upcoming:  "bg-sky-500 text-white",
        completed: "bg-slate-400 text-white",
        cancelled: "bg-red-500 text-white",
    }
    return colours[status]
}

export function reportStatusLabel(status: ReportStatus): string {
    const labels: Record<ReportStatus, string> = {
        pending:           "Pending",
        noted:             "Noted",
        repair_in_progress: "Repair In Progress",
        resolved:          "Resolved",
    }
    return labels[status]
}

export function reportStatusColour(status: ReportStatus): string {
    const colours: Record<ReportStatus, string> = {
        pending:            "bg-amber-100 text-amber-700",
        noted:              "bg-purple-100 text-purple-700",
        repair_in_progress: "bg-orange-100 text-orange-700",
        resolved:           "bg-green-100 text-green-700",
    }
    return colours[status]
}
