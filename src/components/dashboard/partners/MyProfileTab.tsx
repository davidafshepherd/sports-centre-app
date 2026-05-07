"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/providers/AuthProvider"
import { getPartnerProfile, upsertPartnerProfile } from "@/lib/partners"
import { SPORTS, AVAILABILITY_OPTIONS } from "@/types/partnerProfile"
import type { PartnerProfile } from "@/types/partnerProfile"

export default function MyProfileTab() {
    const { user, userProfile } = useAuth()

    const [profile, setProfile] = useState<PartnerProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState("")

    const [form, setForm] = useState({
        displayName: "",
        sport: SPORTS[0] as string,
        skillLevel: "intermediate" as PartnerProfile["skillLevel"],
        availability: [] as string[],
        bio: "",
        isVisible: true,
    })

    // load existing partner profile
    useEffect(() => {
        if (!user) return
        getPartnerProfile(user.uid).then(existingProfile => {
            if (existingProfile) {
                setProfile(existingProfile)
                setForm({
                    displayName: existingProfile.displayName,
                    sport: existingProfile.sport,
                    skillLevel: existingProfile.skillLevel,
                    availability: existingProfile.availability,
                    bio: existingProfile.bio,
                    isVisible: existingProfile.isVisible,
                })
            } else {
                // pre-fill display name from their account so they don't have to retype it
                setForm(prevForm => ({
                    ...prevForm,
                    displayName: `${userProfile?.firstName ?? ""} ${userProfile?.lastName ?? ""}`.trim(),
                }))
            }
            setLoading(false)
        })
    }, [user, userProfile])

    function toggleAvailability(value: string) {
        setForm(prevForm => ({
            ...prevForm,
            availability: prevForm.availability.includes(value)
                ? prevForm.availability.filter(slot => slot !== value)
                : [...prevForm.availability, value],
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
            setError("Failed to save profile. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded-xl" />
            ))}
        </div>
    )

    return (
        <div className="space-y-5 max-w-lg">
            {error && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}
            {saved && (
                <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">Profile saved!</p>
            )}

            {/* display name shown to other members on the Find Partners tab */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                <input
                    value={form.displayName}
                    onChange={e => setForm(prevForm => ({ ...prevForm, displayName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
            </div>

            {/* primary sport shown on their profile card */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sport</label>
                <select
                    value={form.sport}
                    onChange={e => setForm(prevForm => ({ ...prevForm, sport: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                    {SPORTS.map(sport => (
                        <option key={sport} value={sport}>{sport}</option>
                    ))}
                </select>
            </div>

            {/* for skill level buttons */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skill Level</label>
                <div className="flex gap-2">
                    {(["beginner", "intermediate", "advanced"] as const).map(level => (
                        <button
                            key={level}
                            type="button"
                            onClick={() => setForm(prevForm => ({ ...prevForm, skillLevel: level }))}
                            className={[
                                "flex-1 py-2 text-sm rounded-lg border font-medium capitalize transition-colors",
                                form.skillLevel === level
                                    ? "bg-sky-600 text-white border-sky-600"
                                    : "bg-white text-slate-700 border-slate-300 hover:border-sky-400",
                            ].join(" ")}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            {/* availability handled by multi-select buttons, one per time slot */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Availability</label>
                <div className="flex flex-wrap gap-1.5">
                    {AVAILABILITY_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleAvailability(option.value)}
                            className={[
                                "px-2.5 py-1 text-xs rounded-full border font-medium transition-colors",
                                form.availability.includes(option.value)
                                    ? "bg-sky-600 text-white border-sky-600"
                                    : "bg-white text-slate-600 border-slate-300 hover:border-sky-400",
                            ].join(" ")}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* short bio for other members to see */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                <textarea
                    value={form.bio}
                    rows={3}
                    placeholder="Tell others about yourself…"
                    onChange={e => setForm(prevForm => ({ ...prevForm, bio: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
            </div>

            {/* visibility toggle to hide profile if desired */}
            <label className="flex items-center gap-3 cursor-pointer">
                <div
                    onClick={() => setForm(prevForm => ({ ...prevForm, isVisible: !prevForm.isVisible }))}
                    className={[
                        "w-10 h-6 rounded-full transition-colors relative cursor-pointer",
                        form.isVisible ? "bg-sky-600" : "bg-slate-300",
                    ].join(" ")}
                >
                    <div className={[
                        "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                        form.isVisible ? "translate-x-4" : "translate-x-0.5",
                    ].join(" ")} />
                </div>
                <span className="text-sm text-slate-700">Visible to other members</span>
            </label>

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-60 transition-colors"
            >
                {saving ? "Saving…" : profile ? "Save Changes" : "Create Profile"}
            </button>
        </div>
    )
}