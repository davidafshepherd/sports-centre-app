"use client";

import { Dumbbell, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Styles for membership status bage
const statusStyles: Record<string, string> = {
    active: "bg-slate-900 text-white",
    suspended: "bg-slate-200 text-slate-700",
    cancelled: "bg-slate-100 text-slate-400",
};

export default function DashboardView() {
    // Access authentication context
    const { currentUser, userProfile, logout } = useAuth();

    // Store user initials from first and last name
    const initials = [userProfile?.firstName?.[0], userProfile?.lastName?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase();

    // Format account creation date
    const memberSince = userProfile?.createdAt
        ? new Date(userProfile.createdAt).toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
          })
        : "—";

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    {/* App branding */}
                    <div className="flex items-center gap-2">
                        <Dumbbell className="w-6 h-6 text-slate-700" />
                        <span className="text-lg font-bold text-slate-900">StayActive</span>
                    </div>
                    {/* Logout button */}
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Log out
                    </button>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-4xl mx-auto px-6 py-10">
                {/* Welcome message */}
                <h1 className="text-2xl font-bold text-slate-900">
                    Welcome back, {userProfile?.firstName ?? "there"}!
                </h1>
                <p className="mt-1 text-slate-500">Here&apos;s your account overview.</p>

                {/* Profile card */}
                <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center gap-5">
                        {/* User initials avatar */}
                        <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-white text-xl font-bold shrink-0">
                            {initials || "?"}
                        </div>
                        <div>
                            {/* User details */}
                            <h2 className="text-xl font-bold text-slate-900">
                                {userProfile?.firstName} {userProfile?.lastName}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {userProfile?.email ?? currentUser?.email}
                            </p>
                            {/* Membership status badge */}
                            {userProfile?.membershipStatus && (
                                <span
                                    className={`mt-2 inline-block text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${
                                        statusStyles[userProfile.membershipStatus] ??
                                        "bg-slate-100 text-slate-600"
                                    }`}
                                >
                                    {userProfile.membershipStatus}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Account summary */}
                    <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-6">
                        {/* User role */}
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                                Role
                            </p>
                            <p className="text-sm font-medium text-slate-900 capitalize">
                                {userProfile?.role ?? "—"}
                            </p>
                        </div>
                        {/* Date of birth */}
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                                Date of birth
                            </p>
                            <p className="text-sm font-medium text-slate-900">
                                {userProfile?.dateOfBirth ?? "—"}
                            </p>
                        </div>
                        {/* Mermbership start date */}
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                                Member since
                            </p>
                            <p className="text-sm font-medium text-slate-900">{memberSince}</p>
                        </div>
                    </div>
                </div>

                {/* Placeholder for future features */}
                <p className="mt-10 text-center text-sm text-slate-400">
                    More features coming soon.
                </p>
            </main>
        </div>
    );
}
