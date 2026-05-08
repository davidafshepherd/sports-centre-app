'use client';

import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingScreen from '@/components/ui/LoadingScreen';
import StaffView from '@/components/dashboard/staff/StaffView';

export default function StaffPage() {
    // Access authentication context and router
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Navigate to root route if user is not authenticated or authorised
    useEffect(() => {
        if (!user || !userProfile || userProfile.role !== 'admin') router.replace('/');
    }, [user, userProfile, router]);

    // Render loading screen if user is not authenticated or authorised (while redirect takes place)
    if (!user || !userProfile || userProfile.role !== 'admin') return <LoadingScreen />;

    // Render staff view
    return (
        <DashboardLayout>
            <StaffView />
        </DashboardLayout>
    );
}
