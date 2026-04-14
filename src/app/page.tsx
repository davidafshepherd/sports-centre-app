"use client";

import { useAuth } from "@/context/AuthContext";
import DashboardView from "@/components/dashboard/DashboardView";
import HomeView from "@/components/home/HomeView";

export default function Page() {
    // Access authentication context
    const { currentUser, userProfile, isAuthResolved, isProfileResolved, isRegisteringUser } = useAuth();

    // Render a loading screen if authentication is incomplete 
    if (!isAuthResolved || ! isProfileResolved) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    // Render home view during registration
    if (isRegisteringUser) return <HomeView />;

    // Render dashboard view if a user is logged in
    if (currentUser && userProfile) return <DashboardView />;

    // Render home view if no user is logged in
    return <HomeView />;
}
