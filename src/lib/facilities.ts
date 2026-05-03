import { db } from "@/lib/firebase"
import {
    collection, doc, getDocs, getDoc, addDoc, updateDoc,
    query, where, arrayUnion, arrayRemove,
} from "firebase/firestore"
import type { Facility } from "@/types/facility"

export async function getFacilities(): Promise<Facility[]> {
    const q = query(collection(db, "facilities"), where("isActive", "==", true))
    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Facility))
        .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getAllFacilities(): Promise<Facility[]> {
    const snap = await getDocs(collection(db, "facilities"))
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Facility))
        .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getFacilityById(id: string): Promise<Facility | null> {
    const snap = await getDoc(doc(db, "facilities", id))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as Facility
}

export async function getFacilitiesForStaff(staffUid: string): Promise<Facility[]> {
    const q = query(
        collection(db, "facilities"),
        where("assignedStaffIds", "array-contains", staffUid),
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Facility))
}

export async function createFacility(
    data: Omit<Facility, "id" | "createdAt" | "updatedAt" | "assignedStaffIds">,
): Promise<string> {
    const now = new Date().toISOString()
    const ref = await addDoc(collection(db, "facilities"), {
        ...data,
        assignedStaffIds: [],
        createdAt: now,
        updatedAt: now,
    })
    return ref.id
}

export async function updateFacility(
    id: string,
    data: Partial<Omit<Facility, "id" | "createdAt">>,
): Promise<void> {
    await updateDoc(doc(db, "facilities", id), {
        ...data,
        updatedAt: new Date().toISOString(),
    })
}

export async function setFacilityActive(id: string, isActive: boolean): Promise<void> {
    await updateDoc(doc(db, "facilities", id), {
        isActive,
        updatedAt: new Date().toISOString(),
    })
}

export async function assignStaffToFacility(facilityId: string, staffUid: string): Promise<void> {
    await updateDoc(doc(db, "facilities", facilityId), {
        assignedStaffIds: arrayUnion(staffUid),
        updatedAt: new Date().toISOString(),
    })
}

export async function removeStaffFromFacility(facilityId: string, staffUid: string): Promise<void> {
    await updateDoc(doc(db, "facilities", facilityId), {
        assignedStaffIds: arrayRemove(staffUid),
        updatedAt: new Date().toISOString(),
    })
}
