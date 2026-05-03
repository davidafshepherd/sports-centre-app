import { db } from "@/lib/firebase"
import { collection, doc, getDocs, updateDoc, query, where } from "firebase/firestore"
import type { UserProfile } from "@/types/user"

export async function getAllUsers(): Promise<UserProfile[]> {
    const snap = await getDocs(collection(db, "users"))
    return snap.docs
        .map(d => ({ uid: d.id, ...d.data() } as UserProfile))
        .sort((a, b) => a.lastName.localeCompare(b.lastName))
}

export async function getStaffUsers(): Promise<UserProfile[]> {
    const q = query(collection(db, "users"), where("role", "==", "staff"))
    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ uid: d.id, ...d.data() } as UserProfile))
        .sort((a, b) => a.lastName.localeCompare(b.lastName))
}

export async function updateUserRole(uid: string, role: UserProfile["role"]): Promise<void> {
    await updateDoc(doc(db, "users", uid), { role })
}

export async function updateMembershipStatus(
    uid: string,
    status: UserProfile["membershipStatus"],
): Promise<void> {
    await updateDoc(doc(db, "users", uid), { membershipStatus: status })
}
