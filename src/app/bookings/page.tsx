'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberBookingsView from '@/components/dashboard/bookings/MemberBookingsView';
import StaffBookingsView from '@/components/dashboard/bookings/StaffBookingsView';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function BookingsPage() {
    // Access authentication context and router
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Navigate to root route if user is not authenticated
    if (!user || !userProfile) {
        router.replace('/');
        return <LoadingScreen />;
    }

    return (
        <DashboardLayout>
            {userProfile.role === "member" ? <MemberBookingsView /> : <StaffBookingsView />}
        </DashboardLayout>
    );
}
