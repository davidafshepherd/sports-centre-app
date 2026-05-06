'use client';

import { useAuth } from "@/providers/AuthProvider"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/DashboardLayout"
import EquipmentReportsView from "@/components/dashboard/equipment-reports/EquipmentReportsView"
import LoadingScreen from "@/components/ui/LoadingScreen"
import { useEffect } from "react"

export default function EquipmentReportsPage() {
    // access authentication context and router
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // navigate to root route if user is not authenticated or is not a member or staff
    useEffect(() => {
        if (!user || !userProfile || !["member", "staff"].includes(userProfile.role)) {
            router.replace("/")
        }
    }, [user, userProfile, router])

    if (!user || !userProfile || !["member", "staff"].includes(userProfile.role)) {
        return <LoadingScreen />
    }

    return (
        <DashboardLayout>
            <EquipmentReportsView />
        </DashboardLayout>
    );
}
