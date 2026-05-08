'use client';

import { useAuth } from '@/providers/AuthProvider';
import AdminDashboard from './home/AdminDashboard';
import MemberDashboard from './home/MemberDashboard';
import StaffDashboard from './home/StaffDashboard';

export default function DashboardView() {
    // Access authentication context
    const { userProfile } = useAuth();

    // Render the appropriate dashboard based on the user's role
    if (userProfile?.role === 'admin') return <AdminDashboard />;
    if (userProfile?.role === 'staff') return <StaffDashboard />;
    return <MemberDashboard />;
}
