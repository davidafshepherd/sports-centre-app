"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/providers/AuthProvider"
import {
    getPartnerProfile, 
    upsertPartnerProfile,
    searchPartnerProfiles, 
    sendPartnerRequest,
    getPartnerRequestsReceived, 
    getPartnerRequestsSent,
    respondToPartnerRequest,
} from "@/lib/partners"
import type { PartnerProfile, PartnerRequest } from "@/types/partnerProfile"
import { SPORTS, AVAILABILITY_OPTIONS } from "@/types/partnerProfile"
import { UserSearch, CheckCircle, XCircle, Send } from "lucide-react"

// ── Tab bar ────────────────────────────────────────────────────────────────

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
                        "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
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

// ── My Profile tab ─────────────────────────────────────────────────────────

function MyProfileTab() {
    const { user, userProfile } = useAuth()
    const [profile, setProfile]   = useState<PartnerProfile | null>(null)
    const [loading, setLoading]   = useState(true)
    const [saving, setSaving]     = useState(false)
    const [saved, setSaved]       = useState(false)
    const [error, setError]       = useState("")

    const [form, setForm] = useState({
        displayName:  "",
        sport:        SPORTS[0] as string,
        skillLevel:   "intermediate" as PartnerProfile["skillLevel"],
        availability: [] as string[],
        bio:          "",
        isVisible:    true,
    })

    useEffect(() => {
        if (!user) return
        getPartnerProfile(user.uid).then(p => {
            if (p) {
                setProfile(p)
                setForm({
                    displayName:  p.displayName,
                    sport:        p.sport,
                    skillLevel:   p.skillLevel,
                    availability: p.availability,
                    bio:          p.bio,
                    isVisible:    p.isVisible,
                })
            } else {
                setForm(f => ({
                    ...f,
                    displayName: `${userProfile?.firstName ?? ""} ${userProfile?.lastName ?? ""}`.trim(),
                }))
            }
            setLoading(false)
        })
    }, [user])

    function toggleAvailability(value: string) {
        setForm(f => ({
            ...f,
            availability: f.availability.includes(value)
                ? f.availability.filter(v => v !== value)
                : [...f.availability, value],
        }))
    }

    async function handleSave() {
        if (!user) return
        setSaving(true)
        setError("")
        try {
            await upsertPartnerProfile(user.uid, form)
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch {
            setError("Failed to save profile.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-200 rounded-xl" />)}
        </div>
    )

    return (
        <div className="space-y-5 max-w-lg">
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            {saved && <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">Profile saved!</p>}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sport</label>
                <select value={form.sport} onChange={e => setForm(f => ({ ...f, sport: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                    {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skill Level</label>
                <div className="flex gap-2">
                    {(["beginner", "intermediate", "advanced"] as const).map(level => (
                        <button key={level} type="button"
                            onClick={() => setForm(f => ({ ...f, skillLevel: level }))}
                            className={[
                                "flex-1 py-2 text-sm rounded-lg border font-medium capitalize transition-colors",
                                form.skillLevel === level
                                    ? "bg-sky-600 text-white border-sky-600"
                                    : "bg-white text-slate-700 border-slate-300 hover:border-sky-400",
                            ].join(" ")}>
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Availability</label>
                <div className="flex flex-wrap gap-1.5">
                    {AVAILABILITY_OPTIONS.map(opt => (
                        <button key={opt.value} type="button"
                            onClick={() => toggleAvailability(opt.value)}
                            className={[
                                "px-2.5 py-1 text-xs rounded-full border font-medium transition-colors",
                                form.availability.includes(opt.value)
                                    ? "bg-sky-600 text-white border-sky-600"
                                    : "bg-white text-slate-600 border-slate-300 hover:border-sky-400",
                            ].join(" ")}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                <textarea value={form.bio} rows={3}
                    placeholder="Tell others about yourself…"
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
                <div
                    onClick={() => setForm(f => ({ ...f, isVisible: !f.isVisible }))}
                    className={[
                        "w-10 h-6 rounded-full transition-colors relative cursor-pointer",
                        form.isVisible ? "bg-sky-600" : "bg-slate-300",
                    ].join(" ")}>
                    <div className={[
                        "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                        form.isVisible ? "translate-x-4" : "translate-x-0.5",
                    ].join(" ")} />
                </div>
                <span className="text-sm text-slate-700">Visible to other members</span>
            </label>

            <button onClick={handleSave} disabled={saving}
                className="w-full py-2.5 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-60 transition-colors">
                {saving ? "Saving…" : profile ? "Save Changes" : "Create Profile"}
            </button>
        </div>
    )
}

// ── Send request modal ─────────────────────────────────────────────────────

function SendRequestModal({ target, sport, senderName, senderId, onClose, onDone }: {
    target: PartnerProfile
    sport: string
    senderName: string
    senderId: string
    onClose: () => void
    onDone: () => void
}) {
    const [message, setMessage]   = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [error, setError]       = useState("")

    async function handleSend() {
        setSubmitting(true)
        setError("")
        try {
            await sendPartnerRequest({
                senderId,
                senderName,
                receiverId:   target.uid,
                receiverName: target.displayName,
                sport,
                message,
            })
            onDone()
        } catch {
            setError("Failed to send request.")
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
                <h2 className="font-semibold text-slate-900">
                    Partner Request — {target.displayName}
                </h2>
                <p className="text-sm text-slate-500">
                    Invite them to play <span className="font-medium text-slate-700">{sport}</span>
                </p>
                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
                <textarea rows={3} value={message}
                    placeholder="Add a message (optional)…"
                    onChange={e => setMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
                <div className="flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">
                        Cancel
                    </button>
                    <button onClick={handleSend} disabled={submitting}
                        className="flex-1 py-2.5 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-60 transition-colors">
                        {submitting ? "Sending…" : "Send Request"}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Find Partners tab ──────────────────────────────────────────────────────

function FindPartnersTab() {
    const { user, userProfile } = useAuth()
    const [profiles, setProfiles]     = useState<PartnerProfile[]>([])
    const [loading, setLoading]       = useState(false)
    const [sportFilter, setSportFilter] = useState("")
    const [levelFilter, setLevelFilter] = useState("")
    const [requestTarget, setRequestTarget] = useState<PartnerProfile | null>(null)
    const [sentIds, setSentIds]       = useState<Set<string>>(new Set())

    async function search() {
        if (!user) return
        setLoading(true)
        const results = await searchPartnerProfiles(
            user.uid,
            sportFilter || undefined,
            levelFilter || undefined,
        )
        setProfiles(results)
        setLoading(false)
    }

    useEffect(() => { search() }, [sportFilter, levelFilter])

    const senderName = `${userProfile?.firstName ?? ""} ${userProfile?.lastName ?? ""}`.trim()

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <select value={sportFilter} onChange={e => setSportFilter(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="">All sports</option>
                    {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="">All levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
            </div>

            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
                </div>
            ) : profiles.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <UserSearch className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No partners found.</p>
                    <p className="text-sm mt-1">Try adjusting your filters.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {profiles.map(p => (
                        <div key={p.uid} className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-slate-900">{p.displayName}</p>
                                    <p className="text-sm text-slate-500 mt-0.5">
                                        {p.sport} · <span className="capitalize">{p.skillLevel}</span>
                                    </p>
                                    {p.bio && <p className="text-sm text-slate-600 mt-1">{p.bio}</p>}
                                    {p.availability.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {p.availability.slice(0, 5).map(v => {
                                                const label = AVAILABILITY_OPTIONS.find(o => o.value === v)?.label ?? v
                                                return (
                                                    <span key={v} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                                        {label}
                                                    </span>
                                                )
                                            })}
                                            {p.availability.length > 5 && (
                                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                                                    +{p.availability.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setRequestTarget(p)}
                                    disabled={sentIds.has(p.uid)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-medium hover:bg-sky-700 disabled:opacity-60 disabled:bg-slate-300 transition-colors shrink-0">
                                    <Send className="w-3.5 h-3.5" />
                                    {sentIds.has(p.uid) ? "Sent" : "Connect"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {requestTarget && user && (
                <SendRequestModal
                    target={requestTarget}
                    sport={requestTarget.sport}
                    senderName={senderName}
                    senderId={user.uid}
                    onClose={() => setRequestTarget(null)}
                    onDone={() => {
                        setSentIds(s => new Set(s).add(requestTarget.uid))
                        setRequestTarget(null)
                    }}
                />
            )}
        </div>
    )
}

// ── Requests tab ───────────────────────────────────────────────────────────

function RequestsTab() {
    const { user } = useAuth()
    const [received, setReceived] = useState<PartnerRequest[]>([])
    const [sent, setSent]         = useState<PartnerRequest[]>([])
    const [tab, setTab]           = useState("received")
    const [loading, setLoading]   = useState(true)
    const [responding, setResponding] = useState<string | null>(null)

    async function load() {
        if (!user) return
        const [r, s] = await Promise.all([
            getPartnerRequestsReceived(user.uid),
            getPartnerRequestsSent(user.uid),
        ])
        setReceived(r)
        setSent(s)
        setLoading(false)
    }

    useEffect(() => { load() }, [user])

    async function handleRespond(req: PartnerRequest, response: "accepted" | "rejected") {
        setResponding(req.id)
        await respondToPartnerRequest(req.id, req, response)
        setResponding(null)
        load()
    }

    const pendingReceived = received.filter(r => r.status === "pending")
    const tabs = [
        { id: "received", label: "Received", count: pendingReceived.length },
        { id: "sent",     label: "Sent" },
    ]

    if (loading) return (
        <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}
        </div>
    )

    const statusColour = {
        pending:  "bg-amber-100 text-amber-700",
        accepted: "bg-green-100 text-green-700",
        rejected: "bg-red-100 text-red-700",
    }

    return (
        <>
            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            {tab === "received" && (
                <div className="space-y-3">
                    {received.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-sm">No requests received yet.</div>
                    ) : received.map(req => (
                        <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-medium text-slate-900">{req.senderName}</p>
                                    <p className="text-sm text-slate-500">Wants to play {req.sport} with you</p>
                                    {req.message && <p className="text-sm text-slate-400 italic mt-1">&ldquo;{req.message}&rdquo;</p>}
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${statusColour[req.status]}`}>
                                    {req.status}
                                </span>
                            </div>
                            {req.status === "pending" && (
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => handleRespond(req, "accepted")} disabled={responding === req.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-60 transition-colors">
                                        <CheckCircle className="w-3.5 h-3.5" /> Accept
                                    </button>
                                    <button onClick={() => handleRespond(req, "rejected")} disabled={responding === req.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 disabled:opacity-60 transition-colors">
                                        <XCircle className="w-3.5 h-3.5" /> Decline
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {tab === "sent" && (
                <div className="space-y-3">
                    {sent.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-sm">No requests sent yet.</div>
                    ) : sent.map(req => (
                        <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-3">
                            <div>
                                <p className="font-medium text-slate-900">{req.receiverName}</p>
                                <p className="text-sm text-slate-500">{req.sport}</p>
                                {req.message && <p className="text-sm text-slate-400 italic mt-1">&ldquo;{req.message}&rdquo;</p>}
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${statusColour[req.status]}`}>
                                {req.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </>
    )
}

// ── Root export ────────────────────────────────────────────────────────────

export default function PartnersView() {
    const [tab, setTab] = useState("profile")

    const tabs = [
        { id: "profile",  label: "My Profile" },
        { id: "find",     label: "Find Partners" },
        { id: "requests", label: "Requests" },
    ]

    return (
        <div className="space-y-1">
            <div className="mb-1">
                <h1 className="text-2xl font-bold text-slate-900">Find Partners</h1>
                <p className="text-sm text-slate-500 mt-0.5">Connect with other members for your favourite sports.</p>
            </div>
            <Tabs tabs={tabs} active={tab} onChange={setTab} />
            {tab === "profile"  && <MyProfileTab />}
            {tab === "find"     && <FindPartnersTab />}
            {tab === "requests" && <RequestsTab />}
        </div>
    )
}
