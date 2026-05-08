import { facilityFormSchema } from '../facilityFormSchema';

const validHours = {
    monday:    { open: '08:00', close: '20:00' },
    tuesday:   { open: '08:00', close: '20:00' },
    wednesday: { open: '08:00', close: '20:00' },
    thursday:  { open: '08:00', close: '20:00' },
    friday:    { open: '08:00', close: '20:00' },
    saturday:  { open: '09:00', close: '17:00' },
    sunday:    null,
};

const valid = {
    name: 'Tennis Court',
    category: 'tennis',
    description: 'An outdoor tennis court.',
    location: 'Block A',
    maxCapacity: 2,
    slotDurationMins: 60,
    openingHours: validHours,
    usageGuidelines: ['Bring your own racket'],
    isActive: true,
    assignedStaffIds: ['staff-1'],
};

function parse(data: unknown) {
    return facilityFormSchema.safeParse(data);
}

// ─── Valid form ───────────────────────────────────────────────────────────────

describe('valid form', () => {
    test('accepts a fully valid facility', () => {
        expect(parse(valid).success).toBe(true);
    });

    test('accepts a facility where every day is closed (all null)', () => {
        const allClosed = {
            monday: null, tuesday: null, wednesday: null, thursday: null,
            friday: null, saturday: null, sunday: null,
        };
        expect(parse({ ...valid, openingHours: allClosed }).success).toBe(true);
    });

    test('filters out empty strings from usageGuidelines', () => {
        const result = parse({ ...valid, usageGuidelines: ['Rule 1', '', 'Rule 2'] });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.usageGuidelines).toEqual(['Rule 1', 'Rule 2']);
        }
    });

    test('accepts empty usageGuidelines', () => {
        expect(parse({ ...valid, usageGuidelines: [] }).success).toBe(true);
    });

    test('accepts assignedStaffIds as an empty array', () => {
        expect(parse({ ...valid, assignedStaffIds: [] }).success).toBe(true);
    });
});

// ─── Name ─────────────────────────────────────────────────────────────────────

describe('name', () => {
    test('rejects an empty name', () => {
        const result = parse({ ...valid, name: '' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Name is required.');
    });

    test('rejects a whitespace-only name', () => {
        const result = parse({ ...valid, name: '   ' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Name is required.');
    });
});

// ─── Description & location ───────────────────────────────────────────────────

describe('description', () => {
    test('rejects an empty description', () => {
        const result = parse({ ...valid, description: '' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Description is required.');
    });

    test('rejects a whitespace-only description', () => {
        expect(parse({ ...valid, description: '   ' }).success).toBe(false);
    });
});

describe('location', () => {
    test('rejects an empty location', () => {
        const result = parse({ ...valid, location: '' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Location is required.');
    });
});

// ─── Capacity ─────────────────────────────────────────────────────────────────

describe('maxCapacity', () => {
    test('rejects 0', () => {
        const result = parse({ ...valid, maxCapacity: 0 });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Capacity must be at least 1.');
    });

    test('rejects a negative number', () => {
        expect(parse({ ...valid, maxCapacity: -5 }).success).toBe(false);
    });

    test('rejects a non-integer', () => {
        expect(parse({ ...valid, maxCapacity: 1.5 }).success).toBe(false);
    });

    test('accepts 1 (minimum valid)', () => {
        expect(parse({ ...valid, maxCapacity: 1 }).success).toBe(true);
    });
});

// ─── Category ─────────────────────────────────────────────────────────────────

describe('category', () => {
    const validCategories = ['badminton', 'basketball', 'cricket', 'football', 'gym', 'squash', 'swimming', 'tennis', 'yoga'];

    test.each(validCategories)('accepts "%s"', (category) => {
        expect(parse({ ...valid, category }).success).toBe(true);
    });

    test('rejects an unknown category', () => {
        expect(parse({ ...valid, category: 'archery' }).success).toBe(false);
    });
});

// ─── Opening hours superRefine ────────────────────────────────────────────────

describe('openingHours validation', () => {
    test('rejects when open time equals close time', () => {
        const result = parse({
            ...valid,
            openingHours: { ...validHours, monday: { open: '10:00', close: '10:00' } },
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Mon: opening time must be before closing time.');
    });

    test('rejects when open time is after close time', () => {
        const result = parse({
            ...valid,
            openingHours: { ...validHours, monday: { open: '20:00', close: '08:00' } },
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Mon: opening time must be before closing time.');
    });

    test('includes the correct day label in the error message for each day', () => {
        const dayLabels: Record<string, string> = {
            tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
            friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
        };
        for (const [day, label] of Object.entries(dayLabels)) {
            const result = parse({
                ...valid,
                openingHours: { ...validHours, [day]: { open: '18:00', close: '08:00' } },
            });
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe(`${label}: opening time must be before closing time.`);
        }
    });

    test('reports an issue for each day that has invalid hours', () => {
        const result = parse({
            ...valid,
            openingHours: {
                ...validHours,
                monday:  { open: '18:00', close: '08:00' },
                tuesday: { open: '18:00', close: '08:00' },
            },
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues).toHaveLength(2);
    });

    test('error path includes the day key', () => {
        const result = parse({
            ...valid,
            openingHours: { ...validHours, friday: { open: '22:00', close: '06:00' } },
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toEqual(['openingHours', 'friday']);
    });

    test('accepts valid open < close times', () => {
        expect(parse({ ...valid, openingHours: { ...validHours, monday: { open: '06:00', close: '23:00' } } }).success).toBe(true);
    });

    test('accepts null (closed) days without issuing an error', () => {
        expect(parse({ ...valid, openingHours: { ...validHours, saturday: null } }).success).toBe(true);
    });
});
