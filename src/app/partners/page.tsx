'use client';

import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PartnersView from '@/components/dashboard/partners/PartnersView';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function PartnersPage() {
    // Access authentication context and router
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Navigate to root route if user is not authenticated or is not authorised
    useEffect(() => {
        if (!user || !userProfile || userProfile.role !== 'member') router.replace('/');
    }, [user, userProfile, router]);

    // Render loading screen if user is not authenticated or authorised (while redirect takes place)
    if (!user || !userProfile || userProfile.role !== 'member') return <LoadingScreen />;

    return (
        <DashboardLayout>
            <PartnersView />
        </DashboardLayout>
    );
}
