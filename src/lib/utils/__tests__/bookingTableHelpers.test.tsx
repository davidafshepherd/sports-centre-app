import { render, screen, fireEvent } from '@testing-library/react';
import { SortHeader, ResizeHandle, makeResizer } from '../bookingTableHelpers';

// ─── SortHeader ───────────────────────────────────────────────────────────────

describe('SortHeader', () => {
    test('renders the label text', () => {
        render(<SortHeader label="Name" dir="asc" onToggle={() => {}} />);
        expect(screen.getByText('Name')).toBeInTheDocument();
    });

    test('calls onToggle when clicked', () => {
        const onToggle = jest.fn();
        render(<SortHeader label="Date" dir="asc" onToggle={onToggle} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    test('renders a button element', () => {
        render(<SortHeader label="Status" dir="desc" onToggle={() => {}} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('renders an asc arrow when dir is asc', () => {
        const { container } = render(<SortHeader label="Col" dir="asc" onToggle={() => {}} />);
        // lucide ArrowUp renders an svg — just verify an svg is present
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('renders a desc arrow when dir is desc', () => {
        const { container } = render(<SortHeader label="Col" dir="desc" onToggle={() => {}} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});

// ─── ResizeHandle ─────────────────────────────────────────────────────────────

describe('ResizeHandle', () => {
    test('renders without crashing', () => {
        const { container } = render(<ResizeHandle onMouseDown={() => {}} />);
        expect(container.firstChild).toBeInTheDocument();
    });

    test('calls onMouseDown when the handle is pressed', () => {
        const onMouseDown = jest.fn();
        const { container } = render(<ResizeHandle onMouseDown={onMouseDown} />);
        const handle = container.firstChild as HTMLElement;
        fireEvent.mouseDown(handle);
        expect(onMouseDown).toHaveBeenCalledTimes(1);
    });
});

// ─── makeResizer ──────────────────────────────────────────────────────────────

describe('makeResizer', () => {
    let setWidths: jest.Mock;

    beforeEach(() => {
        setWidths = jest.fn();
    });

    afterEach(() => {
        // Ensure any lingering listeners are cleaned up
        document.dispatchEvent(new MouseEvent('mouseup'));
    });

    test('returns a function', () => {
        expect(typeof makeResizer(setWidths)).toBe('function');
    });

    test('registers mousemove and mouseup listeners on the document', () => {
        const addSpy = jest.spyOn(document, 'addEventListener');
        const resizer = makeResizer(setWidths);
        resizer('name', 100, 200);

        expect(addSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
        expect(addSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));

        addSpy.mockRestore();
    });

    test('calls setWidths with a state-updater that applies the correct new width', () => {
        const resizer = makeResizer(setWidths);
        resizer('name', 100, 200); // startX=100, startWidth=200

        // Move to clientX=150: delta = 150-100 = 50, new width = 200+50 = 250
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, bubbles: true }));

        expect(setWidths).toHaveBeenCalledTimes(1);
        const updater = setWidths.mock.calls[0][0] as (prev: Record<string, number>) => Record<string, number>;
        expect(updater({ name: 200, other: 120 })).toEqual({ name: 250, other: 120 });
    });

    test('enforces a minimum width of 80px', () => {
        const resizer = makeResizer(setWidths);
        resizer('name', 100, 200); // startWidth=200

        // Move to clientX=-30: new width = 200 + (-30) - 100 = 70 → clamped to 80
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: -30, bubbles: true }));

        const updater = setWidths.mock.calls[0][0] as (prev: Record<string, number>) => Record<string, number>;
        expect(updater({ name: 200 })).toEqual({ name: 80 });
    });

    test('removes both listeners after mouseup so further moves are ignored', () => {
        const resizer = makeResizer(setWidths);
        resizer('name', 100, 200);

        // End the drag
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        setWidths.mockClear();

        // A subsequent mousemove should NOT fire setWidths
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, bubbles: true }));
        expect(setWidths).not.toHaveBeenCalled();
    });

    test('each drag uses its own captured startX and startWidth', () => {
        const resizer = makeResizer(setWidths);
        resizer('col', 50, 100); // startX=50, startWidth=100

        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 80, bubbles: true }));

        // delta = 80-50 = 30, new width = 100+30 = 130
        const updater = setWidths.mock.calls[0][0] as (prev: Record<string, number>) => Record<string, number>;
        expect(updater({ col: 100 })).toEqual({ col: 130 });
    });
});
