import { registerFormSchema } from '../registerFormSchema';

const valid = {
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1990-06-15',
    email: 'jane@example.com',
    password: 'Password1!',
    confirmPassword: 'Password1!',
    address: {
        line1: '1 Main Street',
        line2: '',
        townOrCity: 'London',
        county: 'Greater London',
        postcode: 'SW1A 1AA',
    },
    role: 'member' as const,
};

function parse(data: unknown) {
    return registerFormSchema.safeParse(data);
}

// ─── Valid form ───────────────────────────────────────────────────────────────

describe('valid form', () => {
    test('accepts a fully valid member submission', () => {
        expect(parse(valid).success).toBe(true);
    });

    test('accepts role "staff"', () => {
        expect(parse({ ...valid, role: 'staff' }).success).toBe(true);
    });

    test('accepts an address with no line2', () => {
        const data = { ...valid, address: { ...valid.address, line2: '' } };
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
        const result = parse({ ...valid, firstName: 'A'.repeat(51) });
        expect(result.success).toBe(false);
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
        // Born 2010-05-09 → not yet 16 on 2026-05-08
        const result = parse({ ...valid, dateOfBirth: '2010-05-09' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('You must be at least 16 years old to register');
        jest.useRealTimers();
    });

    test('accepts an age exactly 16 (boundary)', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-05-08T00:00:00.000Z'));
        // Born 2010-05-08 → exactly 16 on 2026-05-08
        expect(parse({ ...valid, dateOfBirth: '2010-05-08' }).success).toBe(true);
        jest.useRealTimers();
    });

    test('accepts an age well over 16', () => {
        expect(parse({ ...valid, dateOfBirth: '1990-01-01' }).success).toBe(true);
    });
});

// ─── Email ────────────────────────────────────────────────────────────────────

describe('email', () => {
    test('rejects an invalid email address', () => {
        const result = parse({ ...valid, email: 'not-an-email' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Please enter a valid email address');
    });

    test('rejects an email missing the domain', () => {
        expect(parse({ ...valid, email: 'user@' }).success).toBe(false);
    });

    test('accepts a valid email address', () => {
        expect(parse({ ...valid, email: 'user@domain.co.uk' }).success).toBe(true);
    });
});

// ─── Password ─────────────────────────────────────────────────────────────────

describe('password', () => {
    test('rejects a password shorter than 8 characters', () => {
        const result = parse({ ...valid, password: 'Ab1!', confirmPassword: 'Ab1!' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Password must be at least 8 characters');
    });

    test('rejects a password with no uppercase letter', () => {
        const result = parse({ ...valid, password: 'password1!', confirmPassword: 'password1!' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Must contain an uppercase letter');
    });

    test('rejects a password with no lowercase letter', () => {
        const result = parse({ ...valid, password: 'PASSWORD1!', confirmPassword: 'PASSWORD1!' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Must contain a lowercase letter');
    });

    test('rejects a password with no digit', () => {
        const result = parse({ ...valid, password: 'Password!', confirmPassword: 'Password!' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Must contain a number');
    });

    test('rejects a password with no symbol', () => {
        const result = parse({ ...valid, password: 'Password1', confirmPassword: 'Password1' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Must contain a symbol');
    });

    test('accepts a password that meets all requirements', () => {
        expect(parse(valid).success).toBe(true);
    });
});

// ─── Confirm password ─────────────────────────────────────────────────────────

describe('confirmPassword', () => {
    test('rejects when passwords do not match', () => {
        const result = parse({ ...valid, confirmPassword: 'DifferentPass1!' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Passwords do not match');
    });

    test('accepts when passwords match', () => {
        expect(parse(valid).success).toBe(true);
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

// ─── Role ─────────────────────────────────────────────────────────────────────

describe('role', () => {
    test('accepts "member"', () => {
        expect(parse({ ...valid, role: 'member' }).success).toBe(true);
    });

    test('accepts "staff"', () => {
        expect(parse({ ...valid, role: 'staff' }).success).toBe(true);
    });

    test('rejects an unknown role', () => {
        expect(parse({ ...valid, role: 'admin' }).success).toBe(false);
    });
});
