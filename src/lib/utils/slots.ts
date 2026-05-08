import type { Facility, OpeningHours } from '@/types/facility';
import { JS_DAYS } from '@/lib/utils/openingHours';

/**
 * Returns the OpeningHours key for the day of a given date string.
 * @param dateStr Date string in YYYY-MM-DD format.
 * @returns Day name key (e.g. 'monday').
 */
export function getDayFromDate(dateStr: string): keyof OpeningHours {
    const [y, m, d] = dateStr.split('-').map(Number);
    return JS_DAYS[new Date(y, m - 1, d).getDay()] as keyof OpeningHours;
}

/**
 * Converts a time string (HH:MM) to total minutes from midnight.
 * @param t Time string in HH:MM format.
 * @returns Total minutes from midnight.
 */
export function parseTimeToMins(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
}

/**
 * Gets all bookable slot start times (in minutes) for a facility on a given date.
 * @param facility The facility.
 * @param dateStr Date string in YYYY-MM-DD format.
 * @returns Array of slot start times in minutes from midnight.
 */
export function getSlotsForFacilityDate(facility: Facility, dateStr: string): number[] {
    if (!dateStr) return [];
    const [y, m, d] = dateStr.split('-').map(Number);
    const day = JS_DAYS[new Date(y, m - 1, d).getDay()];
    const h = facility.openingHours[day as keyof typeof facility.openingHours];
    if (!h) return [];
    const openMins = parseTimeToMins(h.open);
    const closeMins = parseTimeToMins(h.close);
    const duration = facility.slotDurationMins ?? 60;
    const slots: number[] = [];
    for (let t = openMins; t + duration <= closeMins; t += duration) slots.push(t);
    return slots;
}

/**
 * Gets the next 7 dates starting from today.
 * @returns Array of date strings in YYYY-MM-DD format.
 */
export function getNext7Dates(): string[] {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    return dates;
}

/**
 * Counts the total number of bookable slots for a facility across a set of dates.
 * @param facility The facility.
 * @param dates Array of date strings in YYYY-MM-DD format.
 * @returns Total slot count.
 */
export function getTotalSlots(facility: Facility, dates: string[]): number {
    const duration = facility.slotDurationMins ?? 60;
    return dates.reduce((total, dateStr) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dayName = JS_DAYS[new Date(y, m - 1, d).getDay()];
        const h = facility.openingHours[dayName as keyof typeof facility.openingHours];
        if (!h) return total;
        return total + Math.floor((parseTimeToMins(h.close) - parseTimeToMins(h.open)) / duration);
    }, 0);
}

/**
 * Categorises availability based on booked vs total slots.
 * @param booked Number of booked slots.
 * @param total Total number of slots.
 * @returns Label and Tailwind colour class.
 */
export function availabilityCategory(booked: number, total: number): { label: string; colour: string } {
    if (total === 0) return { label: 'Closed', colour: 'bg-slate-100 text-slate-500' };
    const pct = booked / total;
    if (pct < 0.3) return { label: 'High', colour: 'bg-green-100 text-green-700' };
    if (pct < 0.7) return { label: 'Medium', colour: 'bg-amber-100 text-amber-700' };
    return { label: 'Low', colour: 'bg-red-100 text-red-700' };
}
