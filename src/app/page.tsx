'use client';

import { useAuth } from '@/providers/AuthProvider';
import HomeView from '@/components/home/HomeView';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardView from '@/components/dashboard/DashboardView';
import ProfileErrorScreen from '@/components/ui/ProfileErrorScreen';

export default function Page() {
    // Access authentication context
    const { user, userProfile, isRegistering } = useAuth();

    // Render home view if user is not authenticated or during registration
    if (!user || isRegistering) return <HomeView />;

    // Render profile error screen if the user's profile can't be found
    if (!userProfile) return <ProfileErrorScreen />;

    // Render dashboard view
    return (
        <DashboardLayout>
            <DashboardView />
        </DashboardLayout>
    );
}
