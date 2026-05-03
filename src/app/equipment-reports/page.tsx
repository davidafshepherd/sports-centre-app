"use client"

import { useAuth } from "@/providers/AuthProvider"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/DashboardLayout"
import EquipmentReportsView from "@/components/dashboard/equipment-reports/EquipmentReportsView"
import LoadingScreen from "@/components/ui/LoadingScreen"

export default function EquipmentReportsPage() {
    // Access authentication context and router
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Navigate to root route if user is not authenticated or is not a member or staff
    if (!user || !userProfile || !["member", "staff"].includes(userProfile.role)) {
        router.replace("/")
        return <LoadingScreen />
    }

    // Render equipment reports view
    return (
        <DashboardLayout>
            <EquipmentReportsView />
        </DashboardLayout>
    )
}
