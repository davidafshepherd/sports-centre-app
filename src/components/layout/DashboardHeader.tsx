"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Menu, Bell } from "lucide-react"
import { useAuth } from "@/providers/AuthProvider"
import { getUnreadCount } from "@/lib/notifications"
import NotificationsDrawer from "@/components/dashboard/notifications/NotificationsDrawer"

const PAGE_TITLES: Record<string, string> = {
    "/": "Dashboard",
    "/facilities": "Facilities",
    "/bookings": "Bookings",
    "/partners": "Find Partners",
    "/equipment-reports": "Equipment Reports",
    "/members": "Members",
}

interface Props {
    onMenuClick: () => void
}

export default function DashboardHeader({ onMenuClick }: Props) {
    const pathname = usePathname()
    const { user } = useAuth()
    const [unreadCount, setUnreadCount] = useState(0)
    const [drawerOpen, setDrawerOpen] = useState(false)

    async function refreshCount() {
        if (!user) return
        getUnreadCount(user.uid).then(setUnreadCount).catch(() => {})
    }

    // Re-fetch count on mount, page navigation, and after drawer closes
    useEffect(() => { refreshCount() }, [user, pathname])

    function handleDrawerClose() {
        setDrawerOpen(false)
        // Refresh the badge now that the user may have read notifications
        refreshCount()
    }

    const title =
        PAGE_TITLES[pathname] ??
        (pathname.startsWith("/facilities/") ? "Facility Details" : "")

    return (
        <>
            <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        aria-label="Open sidebar"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <h1 className="text-base font-semibold text-slate-900">{title}</h1>
                </div>

                <button
                    onClick={() => setDrawerOpen(true)}
                    className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    aria-label="Open notifications"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>
            </header>

            <NotificationsDrawer open={drawerOpen} onClose={handleDrawerClose} />
        </>
    )
}
