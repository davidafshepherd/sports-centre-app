'use client';

import { useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);  // Whether the sidebar is open

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Dashboard sidebar */}
            <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Dashboard header */}
            <div className="flex-1 flex flex-col min-w-0">
                <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto [scrollbar-gutter:stable] p-4 sm:p-6">{children}</main>
            </div>
        </div>
    );
}
