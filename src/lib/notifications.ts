import {
    collection, 
    doc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { Notification } from '@/types/notification';

/**
 * Creates a notification for a user.
 * @param data Notification's fields, excluding auto-generated fields.
 */
export async function createNotification(
    data: Omit<Notification, 'id' | 'read' | 'createdAt'>, 
): Promise<void> {
    await addDoc(collection(db,'notifications'), {
        ...data,
        read: false,
        createdAt: new Date().toISOString(),
    });
}

/**
 * Gets all notifications for a user.
 * @param userId User's ID.
 * @returns List of notifications sorted by newest first.
 */
export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
    // Fetch all notifications belonging to the user from Firestore
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);

    // Convert Firestore documents into Notification objects
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Notification))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Gets the number of unread notifications for a user.
 * @param userId User's ID.
 * @returns Number of unread notifications.
 */
export async function getUnreadCount(userId: string): Promise<number> {
    const notifications = await getNotificationsForUser(userId);
    const unread = notifications.filter(n => !n.read);
    return unread.length;
}

/**
 * Marks a notification as read.
 * @param notificationId Notification's ID.
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

/**
 * Marks all notifications for a user as read.
 * @param userId User's ID.
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
    const notifications = await getNotificationsForUser(userId);
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => markNotificationRead(n.id)));
}

/**
 * Deletes notifications.
 * @param ids Notification IDs.
 */
export async function deleteNotifications(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => deleteDoc(doc(db, 'notifications', id))));
}
