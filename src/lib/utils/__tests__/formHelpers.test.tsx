import { render, screen } from '@testing-library/react';
import { inputClass, FieldError } from '../formHelpers';

describe('inputClass', () => {
    test('returns error styling when hasError is true', () => {
        const cls = inputClass(true);
        expect(cls).toContain('border-red-400');
        expect(cls).toContain('focus:ring-red-400');
        expect(cls).not.toContain('border-slate-300');
    });

    test('returns normal styling when hasError is false', () => {
        const cls = inputClass(false);
        expect(cls).toContain('border-slate-300');
        expect(cls).toContain('focus:ring-slate-400');
        expect(cls).not.toContain('border-red-400');
    });

    test('always includes base classes', () => {
        for (const hasError of [true, false]) {
            const cls = inputClass(hasError);
            expect(cls).toContain('w-full');
            expect(cls).toContain('rounded-md');
            expect(cls).toContain('focus:outline-none');
        }
    });
});

describe('FieldError', () => {
    test('renders nothing when message is undefined', () => {
        const { container } = render(<FieldError />);
        expect(container.firstChild).toBeNull();
    });

    test('renders nothing when message is an empty string', () => {
        const { container } = render(<FieldError message="" />);
        expect(container.firstChild).toBeNull();
    });

    test('renders a paragraph with the error message', () => {
        render(<FieldError message="This field is required" />);
        expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    test('applies red text class to the message', () => {
        render(<FieldError message="Error text" />);
        const el = screen.getByText('Error text');
        expect(el.tagName).toBe('P');
        expect(el).toHaveClass('text-red-600');
    });
});
