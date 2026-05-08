import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types/user';

/**
 * Gets all users with the 'staff' role.
 * @returns List of staff user profiles.
 */
export async function getStaffUsers(): Promise<UserProfile[]> {
    const q = query(collection(db, 'users'), where('role', '==', 'staff'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
}

/**
 * Gets multiple user profiles by UID.
 * @param ids Array of user UIDs.
 * @returns List of user profiles for the given UIDs.
 */
export async function getUsersByIds(ids: string[]): Promise<UserProfile[]> {
    if (ids.length === 0) return [];
    const snaps = await Promise.all(ids.map(id => getDoc(doc(db, 'users', id))));
    return snaps
        .filter(s => s.exists())
        .map(s => ({ uid: s.id, ...s.data() } as UserProfile));
}
