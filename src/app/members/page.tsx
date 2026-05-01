"use client"

import { useAuth } from "@/providers/AuthProvider"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/DashboardLayout"
import MembersView from "@/components/dashboard/members/MembersView"
import LoadingScreen from "@/components/ui/LoadingScreen"

export default function MembersPage() {
    // Access authentication context and router
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Navigate to root route if user is not authenticated or is not an admin
    if (!user || !userProfile || userProfile.role !== "admin") { 
        router.replace("/"); 
        return <LoadingScreen /> 
    }

    // Render members view
    return (
        <DashboardLayout>
            <MembersView />
        </DashboardLayout>
    )
}
