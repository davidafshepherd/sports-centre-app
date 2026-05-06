'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FacilitiesView from '@/components/dashboard/facilities/FacilitiesView';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function FacilitiesPage() {
    // Access authentication context and router
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Navigate to root route if user is not authenticated
    if (!user || !userProfile) { 
        router.replace('/'); 
        return <LoadingScreen /> ;
    }

    // Render facilities view
    return (
        <DashboardLayout>
            <FacilitiesView />
        </DashboardLayout>
    );
}
