import {
    requestStatusLabel,
    requestStatuscolour,
    bookingStatusLabel,
    bookingStatusColour,
    reportStatusLabel,
    reportStatusColour,
} from '../status';

describe('requestStatusLabel', () => {
    test.each([
        ['pending',              'Pending'],
        ['approved',             'Approved'],
        ['rejected',             'Declined'],
        ['alternative_suggested','Alternative Suggested'],
    ] as const)('maps %s → %s', (status, expected) => {
        expect(requestStatusLabel(status)).toBe(expected);
    });
});

describe('requestStatuscolour', () => {
    test.each([
        ['pending',              'bg-amber-500 text-white'],
        ['approved',             'bg-emerald-500 text-white'],
        ['rejected',             'bg-red-500 text-white'],
        ['alternative_suggested','bg-violet-500 text-white'],
    ] as const)('maps %s → correct colour class', (status, expected) => {
        expect(requestStatuscolour(status)).toBe(expected);
    });
});

describe('bookingStatusLabel', () => {
    test.each([
        ['upcoming',  'Upcoming'],
        ['cancelled', 'Cancelled'],
        ['completed', 'Completed'],
    ] as const)('maps %s → %s', (status, expected) => {
        expect(bookingStatusLabel(status)).toBe(expected);
    });
});

describe('bookingStatusColour', () => {
    test.each([
        ['upcoming',  'bg-sky-500 text-white'],
        ['cancelled', 'bg-red-500 text-white'],
        ['completed', 'bg-slate-400 text-white'],
    ] as const)('maps %s → correct colour class', (status, expected) => {
        expect(bookingStatusColour(status)).toBe(expected);
    });
});

describe('reportStatusLabel', () => {
    test.each([
        ['pending',           'Pending'],
        ['noted',             'Noted'],
        ['repair_in_progress','Repair In Progress'],
        ['resolved',          'Resolved'],
    ] as const)('maps %s → %s', (status, expected) => {
        expect(reportStatusLabel(status)).toBe(expected);
    });
});

describe('reportStatusColour', () => {
    test.each([
        ['pending',           'bg-amber-100 text-amber-700'],
        ['noted',             'bg-purple-100 text-purple-700'],
        ['repair_in_progress','bg-orange-100 text-orange-700'],
        ['resolved',          'bg-green-100 text-green-700'],
    ] as const)('maps %s → correct colour class', (status, expected) => {
        expect(reportStatusColour(status)).toBe(expected);
    });
});
