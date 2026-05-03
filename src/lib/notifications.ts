import { db } from "@/lib/firebase"
import {
    collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where,
} from "firebase/firestore"
import type { AppNotification, NotificationType } from "@/types/notification"

export async function createNotification(data: {
    userId: string
    type: NotificationType
    title: string
    message: string
    relatedId?: string
    relatedType?: AppNotification["relatedType"]
}): Promise<void> {
    await addDoc(collection(db, "notifications"), {
        ...data,
        read: false,
        createdAt: new Date().toISOString(),
    })
}

export async function getNotificationsForUser(userId: string): Promise<AppNotification[]> {
    const q = query(collection(db, "notifications"), where("userId", "==", userId))
    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as AppNotification))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getUnreadCount(userId: string): Promise<number> {
    const notifications = await getNotificationsForUser(userId)
    return notifications.filter(n => !n.read).length
}

export async function markNotificationRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, "notifications", notificationId), { read: true })
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
    const notifications = await getNotificationsForUser(userId)
    const unread = notifications.filter(n => !n.read)
    await Promise.all(unread.map(n => markNotificationRead(n.id)))
}

export async function deleteNotifications(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => deleteDoc(doc(db, "notifications", id))))
}
