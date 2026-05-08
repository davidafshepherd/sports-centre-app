'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { getUnreadCount } from '@/lib/notifications';
import NotificationsDrawer from '@/components/dashboard/notifications/NotificationsDrawer';

// Page title lookup by route
const PAGE_TITLES: Record<string, string> = {
    '/': 'Dashboard',
    '/facilities': 'Facilities',
    '/bookings': 'Bookings',
    '/partners': 'Find Partners',
    '/equipment-reports': 'Equipment Reports',
    '/staff': 'Staff',
};

// Shape of component's props
interface Props {
    onMenuClick: () => void;    // Function used to open the sidebar
}

export default function DashboardHeader({ onMenuClick }: Props) {
    const pathname = usePathname();                         // Access pathname
    const { user } = useAuth();                             // Access authentication context
    const [unreadCount, setUnreadCount] = useState(0);      // Number of unread notifications
    const [drawerOpen, setDrawerOpen] = useState(false);    // Whether the notifications drawer is open

    // Fetch the current number of unread notifications
    const refreshCount = useCallback(() => {
        if (!user) return;
        getUnreadCount(user.uid).then(setUnreadCount).catch(() => {});
    }, [user]);

    // Re-fetch count on mount, page navigation and when the user changes
    useEffect(() => { refreshCount(); }, [pathname, refreshCount]);

    // Function used to close the notifcation drawer
    function handleDrawerClose() {
        setDrawerOpen(false);
        // Refresh the count now that the user may have read notifications
        refreshCount();
    }

    // Current page's title
    const title = PAGE_TITLES[pathname] ?? (pathname.startsWith('/facilities/') ? 'Facility Details' : '');

    return (
        <>
            <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
                <div className="flex items-center gap-3">
                    {/* Mobile sidebar button */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        aria-label="Open sidebar"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    {/* Page title */}
                    <h1 className="text-base font-semibold text-slate-900">{title}</h1>
                </div>

                {/* Notifications bell */}
                <button
                    onClick={() => setDrawerOpen(true)}
                    className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    aria-label="Open notifications"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </header>

            {/* Notification drawer */}
            <NotificationsDrawer open={drawerOpen} onClose={handleDrawerClose} />
        </>
    );
}
