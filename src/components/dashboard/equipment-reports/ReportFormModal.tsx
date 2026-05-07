"use client"

import { useState } from "react"
import { createEquipmentReport } from "@/lib/equipmentReports"
import type { Facility } from "@/types/facility"
import { createPortal } from "react-dom"

interface Props {
    facilities: Facility[]
    memberId: string
    memberName: string
    onClose: () => void
    onSubmitted: () => void
}

export default function ReportFormModal({ facilities, memberId, memberName, onClose, onSubmitted }: Props) {
    const [form, setForm] = useState({
        facilityId: facilities[0]?.id ?? "",
        equipmentName: "",
        description: "",
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")

    const selectedFacility = facilities.find(facility => facility.id === form.facilityId)

    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault()
        if (!selectedFacility) return

        setSubmitting(true)
        setError("")

        try {
            await createEquipmentReport({
                reportedBy: memberId,
                reporterName: memberName,
                facilityId: selectedFacility.id,
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

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-white rounded-2xl w-full max-w-md">
                {/* modal header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                    <div>
                        <h2 className="font-semibold text-slate-900">Report Faulty Equipment</h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Let staff know about a problem so it can be resolved.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
                    )}

                    {/* facility selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Facility
                        </label>
                        <select
                            value={form.facilityId}
                            onChange={e => setForm(form => ({ ...form, facilityId: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                            {facilities.map(facility => (
                                <option key={facility.id} value={facility.id}>{facility.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Equipment Name
                        </label>
                        <input
                            required
                            value={form.equipmentName}
                            placeholder="e.g. Badminton net, Treadmill #3"
                            onChange={e => setForm(form => ({ ...form, equipmentName: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description of Issue
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={form.description}
                            placeholder="Describe what's wrong with the equipment"
                            onChange={e => setForm(form => ({ ...form, description: e.target.value }))}
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
                            {submitting ? "Submitting…" : "Submit Report"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}