'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PartnersView from '@/components/dashboard/partners/PartnersView';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function PartnersPage() {
    // Access authentication context and router
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Navigate to root route if user is not authenticated or is not a member
    if (!user || !userProfile || userProfile.role !== 'member') { 
        router.replace('/'); 
        return <LoadingScreen /> ;
    }

    // Render partners view
    return (
        <DashboardLayout>
            <PartnersView />
        </DashboardLayout>
    );
}
