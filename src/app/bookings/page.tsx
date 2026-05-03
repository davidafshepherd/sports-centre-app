"use client"

import { useAuth } from "@/providers/AuthProvider"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/DashboardLayout"
import BookingsView from "@/components/dashboard/bookings/BookingsView"
import LoadingScreen from "@/components/ui/LoadingScreen"

export default function BookingsPage() {
    // Access authentication context and router
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Navigate to root route if user is not authenticated
    if (!user || !userProfile) { 
        router.replace("/"); 
        return <LoadingScreen /> 
    }

    // Render bookings view
    return (
        <DashboardLayout>
            <BookingsView />
        </DashboardLayout>
    )
}
