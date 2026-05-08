"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { sendPartnerRequest } from "@/lib/partners"
import type { PartnerProfile } from "@/types/partnerProfile"
import { createPortal } from "react-dom"

interface Props {
    target: PartnerProfile
    sport: string
    senderId: string
    senderName: string
    onClose: () => void
    onDone: () => void
}

export default function SendRequestModal({ target, sport, senderId, senderName, onClose, onDone }: Props) {
    const [message, setMessage] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")

    async function handleSend() {
        setSubmitting(true)
        setError("")
        try {
            await sendPartnerRequest({
                senderId,
                senderName,
                receiverId: target.uid,
                receiverName: target.displayName,
                sport,
                message,
            })
            onDone()
        } catch {
            setError("Failed to send request. Please try again.")
            setSubmitting(false)
        }
    }

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-white rounded-2xl w-full max-w-sm">
                <div className="flex items-start justify-between p-5 border-b border-slate-200">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Partner Request
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Invite <span className="font-medium text-slate-700">{target.displayName}</span> to play <span className="font-medium text-slate-700">{sport}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
                    )}

                    {/* optional message to the person getting the invite */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Message <span className="font-normal text-slate-900">(optional)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={message}
                            placeholder="Introduce yourself or suggest a time…"
                            onChange={e => setMessage(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={submitting}
                            className="flex-1 py-2.5 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-60 transition-colors"
                        >
                            {submitting ? "Sending…" : "Send Request"}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}