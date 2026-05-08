'use client';

import { use, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FacilityDetailsView from '@/components/dashboard/facility-details/FacilityDetailsView';
import LoadingScreen from '@/components/ui/LoadingScreen';

// Shape of component's props
interface Props {
    params: Promise<{ id: string }>;    // Promise containing the facility's ID
}

export default function FacilityDetailPage({ params }: Props) {
    // Access authentication context and router
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Access facility's ID
    const { id } = use(params);

    // Navigate to root route if user is not authenticated
    useEffect(() => {
        if (!user || !userProfile) router.replace('/');
    }, [user, userProfile, router]);

    // Render loading screen if user is not authenticated (while redirect takes place)
    if (!user || !userProfile) return <LoadingScreen />;

    // Render facility details view
    return (
        <DashboardLayout>
            <FacilityDetailsView facilityId={id} />
        </DashboardLayout>
    );
}
