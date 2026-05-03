"use client"

import { useAuth } from "@/providers/AuthProvider"

const statusStyles: Record<string, string> = {
    active:    "bg-green-100 text-green-700",
    suspended: "bg-amber-100 text-amber-700",
    cancelled: "bg-red-100 text-red-700",
}

export default function DashboardView() {
    const { user, userProfile } = useAuth()

    const initials = [userProfile?.firstName?.[0], userProfile?.lastName?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase()

    const memberSince = userProfile?.createdAt
        ? new Date(userProfile.createdAt).toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
          })
        : "—"

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-slate-900">
                Welcome back, {userProfile?.firstName ?? "there"}!
            </h1>
            <p className="mt-1 text-slate-500">Here&apos;s your account overview.</p>

            <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-white text-xl font-bold shrink-0">
                        {initials || "?"}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {userProfile?.firstName} {userProfile?.lastName}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {userProfile?.email ?? user?.email}
                        </p>
                        {userProfile?.membershipStatus && (
                            <span
                                className={`mt-2 inline-block text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${
                                    statusStyles[userProfile.membershipStatus] ?? "bg-slate-100 text-slate-600"
                                }`}
                            >
                                {userProfile.membershipStatus}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-6">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Role</p>
                        <p className="text-sm font-medium text-slate-900 capitalize">{userProfile?.role ?? "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Date of birth</p>
                        <p className="text-sm font-medium text-slate-900">{userProfile?.dateOfBirth ?? "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Member since</p>
                        <p className="text-sm font-medium text-slate-900">{memberSince}</p>
                    </div>
                </div>
            </div>

            <p className="mt-10 text-center text-sm text-slate-400">
                More features coming soon.
            </p>
        </div>
    )
}
