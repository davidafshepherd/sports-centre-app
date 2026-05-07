"use client"

import { useEffect, useState, useCallback } from "react"
import { Send, UserSearch } from "lucide-react"
import { useAuth } from "@/providers/AuthProvider"
import { searchPartnerProfiles } from "@/lib/partners"
import { SPORTS, AVAILABILITY_OPTIONS } from "@/types/partnerProfile"
import type { PartnerProfile } from "@/types/partnerProfile"
import SendRequestModal from "./SendRequestModal"

export default function FindPartnersTab() {
    const { user, userProfile } = useAuth()

    const [profiles, setProfiles] = useState<PartnerProfile[]>([])
    const [loading, setLoading] = useState(false)
    const [sportFilter, setSportFilter] = useState("")
    const [levelFilter, setLevelFilter] = useState("")
    const [requestTarget, setRequestTarget] = useState<PartnerProfile | null>(null)

    //track UIDs weve already sent requests to so the button updates stragit away
    const [sentUids, setSentUids] = useState<Set<string>>(new Set())

    // fetch profiles filtered by sport and/or skill level
    // wrapped in usecallback so useeffect is stable
    const search = useCallback(async () => {
        if (!user) return
        setLoading(true)
        const results = await searchPartnerProfiles(
            user.uid,
            sportFilter || undefined,
            levelFilter || undefined,
        )
        setProfiles(results)
        setLoading(false)
    }, [user, sportFilter, levelFilter])

    useEffect(() => { search() }, [search])

    const senderName = `${userProfile?.firstName ?? ""} ${userProfile?.lastName ?? ""}`.trim()

    return (
        <div className="space-y-4">
            {/* filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <select
                    value={sportFilter}
                    onChange={e => setSportFilter(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                    <option value="">All sports</option>
                    {SPORTS.map(sport => (
                        <option key={sport} value={sport}>{sport}</option>
                    ))}
                </select>
                <select
                    value={levelFilter}
                    onChange={e => setLevelFilter(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                    <option value="">All levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
            </div>

            {/* results */}
            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-200 rounded-xl" />
                    ))}
                </div>
            ) : profiles.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <UserSearch className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-700">No partners found.</p>
                    <p className="text-sm mt-1">Try adjusting your filters.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {profiles.map(profile => (
                        <div key={profile.uid} className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-900">{profile.displayName}</p>
                                    <p className="text-sm text-slate-500 mt-0.5">
                                        {profile.sport} · <span className="capitalize">{profile.skillLevel}</span>
                                    </p>
                                    {profile.bio && (
                                        <p className="text-sm text-slate-600 mt-1">{profile.bio}</p>
                                    )}
                                    {/* show up to 5 availability slots on card */}
                                    {profile.availability.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {profile.availability.slice(0, 5).map(slotValue => {
                                                const slotLabel = AVAILABILITY_OPTIONS.find(option => option.value === slotValue)?.label ?? slotValue
                                                return (
                                                    <span key={slotValue} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                                        {slotLabel}
                                                    </span>
                                                )
                                            })}
                                            {profile.availability.length > 5 && (
                                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                                                    +{profile.availability.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* button disables after sending to avoid duplicates */}
                                <button
                                    onClick={() => setRequestTarget(profile)}
                                    disabled={sentUids.has(profile.uid)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-medium hover:bg-sky-700 disabled:opacity-60 disabled:bg-slate-300 transition-colors shrink-0"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {sentUids.has(profile.uid) ? "Sent" : "Connect"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* partner request modal */}
            {requestTarget && user && (
                <SendRequestModal
                    target={requestTarget}
                    sport={requestTarget.sport}
                    senderId={user.uid}
                    senderName={senderName}
                    onClose={() => setRequestTarget(null)}
                    onDone={() => {
                        setSentUids(prevSentUids => new Set(prevSentUids).add(requestTarget.uid))
                        setRequestTarget(null)
                    }}
                />
            )}
        </div>
    )
}