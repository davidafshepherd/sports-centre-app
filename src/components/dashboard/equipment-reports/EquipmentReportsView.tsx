"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/providers/AuthProvider"
import {
    createEquipmentReport,
    getEquipmentReportsByMember,
    getEquipmentReportsForStaff,
    getAllEquipmentReports,
    updateEquipmentReportStatus,
} from "@/lib/equipmentReports"
import { getActiveFacilities } from "@/lib/facilities"
import type { EquipmentReport, ReportStatus } from "@/types/equipmentReport"
import type { Facility } from "@/types/facility"
import { reportStatusColour, reportStatusLabel } from "@/lib/utils/status"
import { formatDate } from "@/lib/utils/date"
import { Wrench, Plus, ChevronDown } from "lucide-react"

// ── Report form modal ──────────────────────────────────────────────────────

function ReportFormModal({ facilities, memberName, memberId, onClose, onSubmitted }: {
    facilities: Facility[]
    memberName: string
    memberId: string
    onClose: () => void
    onSubmitted: () => void
}) {
    const [form, setForm] = useState({
        facilityId: facilities[0]?.id ?? "",
        equipmentName: "",
        description: "",
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")

    const selectedFacility = facilities.find(f => f.id === form.facilityId)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedFacility) return
        setSubmitting(true)
        setError("")
        try {
            await createEquipmentReport({
                reportedBy: memberId,
                reporterName: memberName,
                facilityId: form.facilityId,
                facilityName: selectedFacility.name,
                equipmentName: form.equipmentName.trim(),
                description: form.description.trim(),
            })
            onSubmitted()
        } catch {
            setError("Failed to submit report. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="p-5 border-b border-slate-200">
                    <h2 className="font-semibold text-slate-900">Report Faulty Equipment</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Facility</label>
                        <select value={form.facilityId}
                            onChange={e => setForm(f => ({ ...f, facilityId: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Equipment Name</label>
                        <input required value={form.equipmentName}
                            placeholder="e.g. Badminton net, Treadmill #3"
                            onChange={e => setForm(f => ({ ...f, equipmentName: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description of Issue</label>
                        <textarea required rows={3} value={form.description}
                            placeholder="Describe what's wrong with the equipment…"
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting}
                            className="flex-1 py-2.5 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-60 transition-colors">
                            {submitting ? "Submitting…" : "Submit Report"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ── Status update modal (staff) ────────────────────────────────────────────

function UpdateStatusModal({ report, staffUid, onClose, onUpdated }: {
    report: EquipmentReport
    staffUid: string
    onClose: () => void
    onUpdated: () => void
}) {
    const [status, setStatus] = useState<ReportStatus>(report.status)
    const [note, setNote] = useState(report.staffNote)
    const [submitting, setSubmitting] = useState(false)

    const statuses: ReportStatus[] = ["pending", "noted", "repair_in_progress", "resolved"]

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        await updateEquipmentReportStatus(report.id, report, status, staffUid, note)
        setSubmitting(false)
        onUpdated()
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm">
                <div className="p-5 border-b border-slate-200">
                    <h2 className="font-semibold text-slate-900">Update Report Status</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{report.equipmentName} · {report.facilityName}</p>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as ReportStatus)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                            {statuses.map(s => (
                                <option key={s} value={s}>{reportStatusLabel(s)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Staff Note (optional)</label>
                        <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
                            placeholder="Add a note for the member…"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting}
                            className="flex-1 py-2.5 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-60 transition-colors">
                            {submitting ? "Saving…" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ── Report card ────────────────────────────────────────────────────────────

function ReportCard({ report, canUpdate, onUpdate }: {
    report: EquipmentReport
    canUpdate: boolean
    onUpdate: (r: EquipmentReport) => void
}) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                    <p className="font-medium text-slate-900">{report.equipmentName}</p>
                    <p className="text-sm text-slate-500">{report.facilityName} · {formatDate(report.createdAt.split("T")[0])}</p>
                    {canUpdate && (
                        <p className="text-xs text-slate-400 mt-0.5">Reported by {report.reporterName}</p>
                    )}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${reportStatusColour(report.status)}`}>
                    {reportStatusLabel(report.status)}
                </span>
            </div>
            <p className="text-sm text-slate-600">{report.description}</p>
            {report.staffNote && (
                <p className="text-sm text-slate-500 italic mt-2 pl-3 border-l-2 border-slate-200">
                    Staff note: {report.staffNote}
                </p>
            )}
            {canUpdate && (
                <button onClick={() => onUpdate(report)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 font-medium transition-colors">
                    <ChevronDown className="w-3.5 h-3.5" /> Update Status
                </button>
            )}
        </div>
    )
}

// ── Main view ──────────────────────────────────────────────────────────────

export default function EquipmentReportsView() {
    const { user, userProfile } = useAuth()
    const role = userProfile?.role
    const [reports, setReports] = useState<EquipmentReport[]>([])
    const [facilities, setFacilities] = useState<Facility[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [updateTarget, setUpdateTarget] = useState<EquipmentReport | null>(null)

    async function load() {
        if (!user || !role) return
        const [rpts, facs] = await Promise.all([
            role === "member"
                ? getEquipmentReportsByMember(user.uid)
                : role === "staff"
                    ? getEquipmentReportsForStaff(user.uid)
                    : getAllEquipmentReports(),
            role === "member" ? getActiveFacilities() : Promise.resolve([] as Facility[]),
        ])
        setReports(rpts)
        setFacilities(facs)
        setLoading(false)
    }

    useEffect(() => { load() }, [user, role])

    if (loading) return (
        <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
        </div>
    )

    const canUpdate = role === "staff" || role === "admin"

    return (
        <div className="max-w-2xl space-y-5">
            {role === "member" && (
                <div className="flex justify-end">
                    <button onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors">
                        <Plus className="w-4 h-4" /> Report Equipment Issue
                    </button>
                </div>
            )}

            {reports.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <Wrench className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No equipment reports yet.</p>
                    {role === "member" && (
                        <p className="text-sm mt-1">Click "Report Equipment Issue" to log a problem.</p>
                    )}
                    {role === "staff" && (
                        <p className="text-sm mt-1">No reports for your assigned facilities.</p>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {reports.map(r => (
                        <ReportCard
                            key={r.id}
                            report={r}
                            canUpdate={canUpdate}
                            onUpdate={setUpdateTarget}
                        />
                    ))}
                </div>
            )}

            {showForm && userProfile && (
                <ReportFormModal
                    facilities={facilities}
                    memberName={`${userProfile.firstName} ${userProfile.lastName}`}
                    memberId={user?.uid ?? ""}
                    onClose={() => setShowForm(false)}
                    onSubmitted={() => { setShowForm(false); load() }}
                />
            )}

            {updateTarget && user && (
                <UpdateStatusModal
                    report={updateTarget}
                    staffUid={user.uid}
                    onClose={() => setUpdateTarget(null)}
                    onUpdated={() => { setUpdateTarget(null); load() }}
                />
            )}
        </div>
    )
}
