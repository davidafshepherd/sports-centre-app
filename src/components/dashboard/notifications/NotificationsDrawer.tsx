'use client';

import { useEffect, useState } from 'react';
import { X, Check, CheckCheck, Bell, Building2, CalendarDays, UserCheck, UserX, Wrench } from 'lucide-react';

import { formatRelativeTime } from '@/lib/utils/date';
import {
    getNotificationsForUser,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotifications,
} from '@/lib/notifications';
import { useAuth } from '@/providers/AuthProvider';
import type { Notification, NotificationType } from '@/types/notification';

// Maps a notification type to its icon
function notifIcon(type: NotificationType) {
    if (type.startsWith('booking'))            return <CalendarDays className="w-4 h-4" />;
    if (type === 'partner_accepted')           return <UserCheck className="w-4 h-4" />;
    if (type === 'partner_rejected')           return <UserX className="w-4 h-4" />;
    if (type === 'partner_request')            return <UserCheck className="w-4 h-4" />;
    if (type === 'equipment_report_updated')   return <Wrench className="w-4 h-4" />;
    if (type === 'facility_updated')           return <Building2 className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
}

// Maps a notification type to its icon background and text colour classes
function notifIconColour(type: NotificationType): string {
    if (type === 'booking_approved' || type === 'partner_accepted') return 'bg-green-100 text-green-600';
    if (type === 'booking_rejected' || type === 'partner_rejected') return 'bg-red-100 text-red-600';
    if (type === 'booking_completed')          return 'bg-slate-100 text-slate-500';
    if (type === 'booking_alternative')        return 'bg-blue-100 text-blue-600';
    if (type === 'booking_cancelled')          return 'bg-red-100 text-red-600';
    if (type === 'booking_request_received')   return 'bg-amber-100 text-amber-600';
    if (type === 'booking_confirmed_staff')    return 'bg-sky-100 text-sky-600';
    if (type === 'partner_request')            return 'bg-sky-100 text-sky-600';
    if (type === 'equipment_report_updated')   return 'bg-orange-100 text-orange-600';
    if (type === 'facility_updated')           return 'bg-sky-100 text-sky-600';
    return 'bg-slate-100 text-slate-500';
}

// Shape of component's props
interface Props {
    open: boolean;
    onClose: () => void;
}

export default function NotificationsDrawer({ open, onClose }: Props) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);   // All notifications for the user
    const [loading, setLoading] = useState(false);                             // Whether notifications are being fetched
    const [markingAll, setMarkingAll] = useState(false);                       // Whether mark-all-read is in progress

    // Fetch when the drawer opens
    useEffect(() => {
        if (!open || !user) return;
        const uid = user.uid;
        Promise.resolve()
            .then(() => setLoading(true))
            .then(() => getNotificationsForUser(uid))
            .then(setNotifications)
            .finally(() => setLoading(false));
    }, [open, user]);

    async function handleMarkRead(notif: Notification) {
        if (notif.read) return;
        await markNotificationRead(notif.id);
        setNotifications(prev =>
            prev.map(n => n.id === notif.id ? { ...n, read: true } : n),
        );
    }

    async function handleMarkAllRead() {
        if (!user) return;
        setMarkingAll(true);
        await markAllNotificationsRead(user.uid);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setMarkingAll(false);
    }

    const unread = notifications.filter(n => !n.read).length;   // Count of unread notifications

    function handleClose() {
        const readIds = notifications.filter(n => n.read).map(n => n.id);
        if (readIds.length > 0) deleteNotifications(readIds);
        onClose();
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className={[
                    'fixed inset-0 bg-black/40 z-40 transition-opacity duration-300',
                    open ? 'opacity-100' : 'opacity-0 pointer-events-none',
                ].join(' ')}
                onClick={handleClose}
            />

            {/* Panel */}
            <div
                className={[
                    'fixed inset-y-0 right-0 z-50 w-96 max-w-full bg-white shadow-xl flex flex-col',
                    'transition-transform duration-300 ease-in-out',
                    open ? 'translate-x-0' : 'translate-x-full',
                ].join(' ')}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-slate-900">Notifications</h2>
                        {/* Unread count badge */}
                        {unread > 0 && (
                            <span className="text-xs bg-sky-100 text-sky-700 font-medium px-2 py-0.5 rounded-full">
                                {unread} new
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {/* Mark all read button */}
                        {unread > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={markingAll}
                                title="Mark all as read"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Mark all read
                            </button>
                        )}
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        // Loading skeleton
                        <div className="space-y-px p-2 animate-pulse">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-slate-100 rounded-lg" />
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        // Empty state
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 py-16">
                            <Bell className="w-10 h-10 text-slate-200" />
                            <p className="text-sm font-medium">No notifications yet</p>
                        </div>
                    ) : (
                        // Notifications list
                        <ul className="divide-y divide-slate-100">
                            {notifications.map(notif => (
                                <li
                                    key={notif.id}
                                    className={`flex items-stretch ${notif.read ? '' : 'bg-sky-50'}`}
                                >
                                    {/* Content */}
                                    <div className="flex items-start gap-3 px-4 py-3.5 flex-1 min-w-0">
                                        {/* Icon */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${notifIconColour(notif.type)}`}>
                                            {notifIcon(notif.type)}
                                        </div>

                                        {/* Text */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug ${notif.read ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                                                {notif.message}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {formatRelativeTime(notif.createdAt)}
                                            </p>
                                        </div>

                                        {/* Blue dot */}
                                        {!notif.read && (
                                            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 self-center" />
                                        )}
                                    </div>

                                    {/* Tick box */}
                                    <button
                                        onClick={() => handleMarkRead(notif)}
                                        disabled={notif.read}
                                        title={notif.read ? 'Already read' : 'Mark as read'}
                                        className={[
                                            'flex items-center justify-center w-12 shrink-0 border-l border-slate-100 transition-colors',
                                            notif.read
                                                ? 'text-green-400 cursor-default'
                                                : 'text-slate-400 hover:text-green-600 hover:bg-green-50 cursor-pointer',
                                        ].join(' ')}
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}
