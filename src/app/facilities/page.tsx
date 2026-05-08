'use client';

import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminFacilitiesView from '@/components/dashboard/facilities/AdminFacilitiesView';
import FacilitiesView from '@/components/dashboard/facilities/FacilitiesView';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function FacilitiesPage() {
    // Access authentication context and router
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Navigate to root route if user is not authenticated
    useEffect(() => {
        if (!user || !userProfile) router.replace('/');
    }, [user, userProfile, router]);

    // Render loading screen if user is not authenticated (while redirect takes place)
    if (!user || !userProfile) return <LoadingScreen />;

    // Render facilities view
    return (
        <DashboardLayout>
            {userProfile.role === 'admin' ? <AdminFacilitiesView /> : <FacilitiesView />}
        </DashboardLayout>
    );
}
