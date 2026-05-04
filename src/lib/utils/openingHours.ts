import type { OpeningHours } from '@/types/facility';

export type DayKey = keyof OpeningHours;

export const JS_DAYS: readonly DayKey[] = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
export const WEEK_DAYS: readonly DayKey[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export const DAY_LABELS: Record<DayKey, string> = {
    monday: 'Mon', 
    tuesday: 'Tue', 
    wednesday: 'Wed', 
    thursday: 'Thu',
    friday: 'Fri', 
    saturday: 'Sat', 
    sunday: 'Sun',
}

/**
 * Gets today's weekday key.
 * @returns Current weekday key.
 */
export function getTodayKey(): DayKey {
    return JS_DAYS[new Date().getDay()];
}

/**
 * Gets today's opening hours for a facility.
 * @param openingHours Facility opening hours.
 * @returns Formatted time range string.
 */
export function getTodayLabel(openingHours: OpeningHours): string {
    // Today's weekday key
    const day = getTodayKey();

    // Facility's opening hours for today
    const hours = openingHours[day];

    // Build formatted time range string 
    return hours ? `${hours.open}-${hours.close}` : 'Closed today';
}
