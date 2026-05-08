'use client';

import { useEffect } from 'react';
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

    // Navigate to root route if user is not authenticated or authorised
    useEffect(() => {
        if (!user || !userProfile || !['member', 'staff'].includes(userProfile.role)) router.replace('/');
    }, [user, userProfile, router]);

    // Render loading screen if user is not authenticated or authorised (while redirect takes place)
    if (!user || !userProfile || !['member', 'staff'].includes(userProfile.role)) return <LoadingScreen />;

    // Render bookings view
    return (
        <DashboardLayout>
            {userProfile.role === 'member' ? <MemberBookingsView /> : <StaffBookingsView />}
        </DashboardLayout>
    );
}
