"use client"

import { useState } from "react"
import { updateEquipmentReportStatus } from "@/lib/equipmentReports"
import { reportStatusLabel } from "@/lib/utils/status"
import type { EquipmentReport, ReportStatus } from "@/types/equipmentReport"
import { createPortal } from "react-dom"

interface Props {
    report: EquipmentReport
    staffUid: string
    onClose: () => void
    onUpdated: () => void
}

// list of statuses that staff can put on a report
const STATUS_OPTIONS: ReportStatus[] = ["pending", "noted", "repair_in_progress", "resolved"]

export default function UpdateStatusModal({ report, staffUid, onClose, onUpdated }: Props) {
    const [status, setStatus] = useState<ReportStatus>(report.status)
    const [note, setNote] = useState(report.staffNote)
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault()
        setSubmitting(true)
        // keeps status + note to firestore and sends a notification to the member
        await updateEquipmentReportStatus(report.id, report, status, staffUid, note)
        setSubmitting(false)
        onUpdated()
    }

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-white rounded-2xl w-full max-w-sm">

                <div className="flex items-start justify-between p-5 border-b border-slate-200">
                    <div>
                        <h2 className="font-semibold text-slate-900">Update Report Status</h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {report.equipmentName} · {report.facilityName}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* selects status of the report */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value as ReportStatus)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                            {STATUS_OPTIONS.map(status => (
                                <option key={status} value={status}>{reportStatusLabel(status)}</option>
                            ))}
                        </select>
                    </div>

                    {/* staff note which is visible to the member after update */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Note for Member <span className="font-normal text-slate-400">(optional)</span>
                        </label>
                        <textarea
                            rows={2}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="e.g. Awaiting spare parts, expected fix by Friday…"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-2.5 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-60 transition-colors"
                        >
                            {submitting ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}