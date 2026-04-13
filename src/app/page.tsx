"use client";

import { useAuth } from "@/context/AuthContext";
import DashboardView from "@/components/dashboard/DashboardView";
import HomeView from "@/components/home/HomeView";

export default function Page() {
    const { currentUser, isAuthResolved } = useAuth();

    if (!isAuthResolved) return null;
    if (currentUser) return <DashboardView />;
    return <HomeView />;
}
