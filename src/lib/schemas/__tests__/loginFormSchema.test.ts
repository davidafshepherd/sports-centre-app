import { loginFormSchema } from '../loginFormSchema';

const valid = {
    email: 'user@example.com',
    password: 'anypassword',
};

function parse(data: unknown) {
    return loginFormSchema.safeParse(data);
}

describe('loginFormSchema', () => {
    test('accepts a valid email and password', () => {
        expect(parse(valid).success).toBe(true);
    });

    // ─── Email ────────────────────────────────────────────────────────────────

    test('rejects an invalid email address', () => {
        const result = parse({ ...valid, email: 'not-an-email' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Please enter a valid email address');
    });

    test('rejects an email with no domain', () => {
        expect(parse({ ...valid, email: 'user@' }).success).toBe(false);
    });

    test('rejects an empty email', () => {
        expect(parse({ ...valid, email: '' }).success).toBe(false);
    });

    test('accepts a valid email with a subdomain', () => {
        expect(parse({ ...valid, email: 'user@mail.example.co.uk' }).success).toBe(true);
    });

    // ─── Password ─────────────────────────────────────────────────────────────

    test('rejects an empty password', () => {
        const result = parse({ ...valid, password: '' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Password is required');
    });

    test('accepts a single-character password (no strength requirement)', () => {
        expect(parse({ ...valid, password: 'x' }).success).toBe(true);
    });

    test('accepts a very long password', () => {
        expect(parse({ ...valid, password: 'a'.repeat(200) }).success).toBe(true);
    });
});
