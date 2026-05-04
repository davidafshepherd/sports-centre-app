/**
 * Converts an ISO date string into a readable format.
 * e.g. 2026-05-03 -> Sun, 3 May 2026.
 * @param dateStr ISO date string.
 * @returns Formatted date string.
 */
export function formatDate(dateStr: string): string {
    // Create a Date object from the ISO date string
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    
    // Convert Date object into a string using UK locale
    return date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/**
 * Converts an ISO datetime string into a readable format.
 * e.g. 2026-05-03T18:30:00Z -> 3 May 2026, 18:30.
 * @param isoStr ISO datetime string.
 * @returns Formatted datetime string.
 */
export function formatDateTime(isoStr: string): string {
    // Create a Date object from the ISO datetime string
    const date = new Date(isoStr);

    // Convert Date object into a string using UK locale
    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Converts an ISO datetime string into a relative format.
 * e.g. just now, 5m ago, 2h ago, 3d ago, etc.
 * @param isoStr ISO datetime string.
 * @returns Relative time string.
 */
export function formatRelativeTime(isoStr: string): string {
    // Calculate elapsed time in milliseconds
    const diff = Date.now() - new Date(isoStr).getTime();

    // If elapsed time is less than 1 minute, return 'just now'
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return "just now";

    // If elapsed time is less than 60 minutes, return a minute-based relative time
    if (mins < 60) return `${mins}m ago`;

    // If elapsed time is less than 24 hours, return an hour-based relative time
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;

    // If elapsed time is less than 7 days, return a day-based relative time
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `${days}d ago`;

    // Fallback to a formatted date string for older timestamps
    return formatDate(isoStr.split("T")[0]);
}

/**
 * Converts a booking slot into a readable format.
 * e.g. 480, 60 -> 8:00 AM - 9:00 AM.
 * @param startMins Slot start time in minutes from midnight.
 * @param durationMins Slot duration in minutes.
 * @returns Formatted time range string.
 */
export function formatSlot(startMins: number, durationMins: number): string {
    // Converts minutes from midnight into a 12-hour time string
    const fmt = (mins: number) => {
        const h = Math.floor(mins / 60) % 24;
        const m = mins % 60;
        const hour = h % 12 || 12;
        const ampm = h < 12 ? "AM" : "PM";

        return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
    };

    // Build formatted time range string
    return `${fmt(startMins)} - ${fmt(startMins + durationMins)}`;
}

/**
 * Gets the minimum booking date. This is the current date.
 * @returns Date in YYYY-MM-DD format.
 */
export function getMinBookingDate(): string {
    return new Date().toISOString().split("T")[0];
}

/**
 * Gets the maximum booking date. This is 60 days from the current date.
 * @returns Date in YYYY-MM-DD format.
 */
export function getMaxBookingDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 60);
    return date.toISOString().split("T")[0];
}
