'use client';

import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EquipmentReportsView from '@/components/dashboard/equipment-reports/EquipmentReportsView';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function EquipmentReportsPage() {
    // access authentication context and router
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Navigate to root route if user is not authenticated or authorised
    useEffect(() => {
        if (!user || !userProfile || !['member', 'staff'].includes(userProfile.role)) router.replace('/');
    }, [user, userProfile, router]);

    // Render loading screen if user is not authenticated or authorised (while redirect takes place)
    if (!user || !userProfile || !['member', 'staff'].includes(userProfile.role)) return <LoadingScreen />;

    return (
        <DashboardLayout>
            <EquipmentReportsView />
        </DashboardLayout>
    );
}
