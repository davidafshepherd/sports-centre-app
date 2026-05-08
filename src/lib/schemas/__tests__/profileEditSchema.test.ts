import { profileFormSchema } from '../profileEditSchema';

const valid = {
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1990-06-15',
    address: {
        line1: '1 Main Street',
        line2: 'Flat 2',
        townOrCity: 'London',
        county: 'Greater London',
        postcode: 'SW1A 1AA',
    },
};

function parse(data: unknown) {
    return profileFormSchema.safeParse(data);
}

// ─── Valid form ───────────────────────────────────────────────────────────────

describe('valid form', () => {
    test('accepts a fully valid profile', () => {
        expect(parse(valid).success).toBe(true);
    });

    test('accepts a profile without line2', () => {
        const data = { ...valid, address: { ...valid.address, line2: undefined } };
        expect(parse(data).success).toBe(true);
    });
});

// ─── First name ───────────────────────────────────────────────────────────────

describe('firstName', () => {
    test('rejects an empty first name', () => {
        const result = parse({ ...valid, firstName: '' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('First name is required');
    });

    test('rejects a first name longer than 50 characters', () => {
        expect(parse({ ...valid, firstName: 'A'.repeat(51) }).success).toBe(false);
    });

    test('accepts a first name of exactly 50 characters', () => {
        expect(parse({ ...valid, firstName: 'A'.repeat(50) }).success).toBe(true);
    });
});

// ─── Last name ────────────────────────────────────────────────────────────────

describe('lastName', () => {
    test('rejects an empty last name', () => {
        const result = parse({ ...valid, lastName: '' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Last name is required');
    });

    test('rejects a last name longer than 50 characters', () => {
        expect(parse({ ...valid, lastName: 'B'.repeat(51) }).success).toBe(false);
    });

    test('accepts a last name of exactly 50 characters', () => {
        expect(parse({ ...valid, lastName: 'B'.repeat(50) }).success).toBe(true);
    });
});

// ─── Date of birth ────────────────────────────────────────────────────────────

describe('dateOfBirth', () => {
    test('rejects an empty date of birth', () => {
        expect(parse({ ...valid, dateOfBirth: '' }).success).toBe(false);
    });

    test('rejects an invalid date string', () => {
        expect(parse({ ...valid, dateOfBirth: 'not-a-date' }).success).toBe(false);
    });

    test('rejects an age clearly under 16', () => {
        expect(parse({ ...valid, dateOfBirth: '2020-01-01' }).success).toBe(false);
    });

    test('rejects an age just under 16 (boundary)', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-05-08T00:00:00.000Z'));
        const result = parse({ ...valid, dateOfBirth: '2010-05-09' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('You must be at least 16 years old');
        jest.useRealTimers();
    });

    test('accepts an age exactly 16 (boundary)', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-05-08T00:00:00.000Z'));
        expect(parse({ ...valid, dateOfBirth: '2010-05-08' }).success).toBe(true);
        jest.useRealTimers();
    });

    test('accepts an age well over 16', () => {
        expect(parse({ ...valid, dateOfBirth: '1990-01-01' }).success).toBe(true);
    });
});

// ─── Address ──────────────────────────────────────────────────────────────────

describe('address', () => {
    test('rejects an empty address line 1', () => {
        const result = parse({ ...valid, address: { ...valid.address, line1: '' } });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Address line 1 is required');
    });

    test('rejects an empty town or city', () => {
        const result = parse({ ...valid, address: { ...valid.address, townOrCity: '' } });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Town or city is required');
    });

    test('rejects an empty county', () => {
        const result = parse({ ...valid, address: { ...valid.address, county: '' } });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('County is required');
    });

    test('rejects an empty postcode', () => {
        const result = parse({ ...valid, address: { ...valid.address, postcode: '' } });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Postcode is required');
    });
});
