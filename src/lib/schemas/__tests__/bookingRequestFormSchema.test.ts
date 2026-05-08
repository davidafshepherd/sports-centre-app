import { bookingRequestFormSchema } from '../bookingRequestFormSchema';

function parse(data: unknown) {
    return bookingRequestFormSchema.safeParse(data);
}

describe('bookingRequestFormSchema', () => {
    // ─── Valid ─────────────────────────────────────────────────────────────────

    test('accepts an activity description of exactly 3 characters', () => {
        expect(parse({ activityDescription: 'abc' }).success).toBe(true);
    });

    test('accepts a longer activity description', () => {
        expect(parse({ activityDescription: 'Friendly doubles match' }).success).toBe(true);
    });

    // ─── Invalid ───────────────────────────────────────────────────────────────

    test('rejects an empty description', () => {
        const result = parse({ activityDescription: '' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Please describe your activity');
    });

    test('rejects a 1-character description', () => {
        const result = parse({ activityDescription: 'a' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Please describe your activity');
    });

    test('rejects a 2-character description', () => {
        const result = parse({ activityDescription: 'ab' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Please describe your activity');
    });

    test('rejects a missing activityDescription field', () => {
        expect(parse({}).success).toBe(false);
    });
});
