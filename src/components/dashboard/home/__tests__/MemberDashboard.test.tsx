import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MemberDashboard from '../MemberDashboard';
import { useAuth } from '@/providers/AuthProvider';
import { getBookingsForMember, cancelBooking } from '@/lib/bookings';
import { getBookingRequestsForMember } from '@/lib/bookingRequests';
import { deleteUserProfile } from '@/lib/users';
import { deleteUser } from 'firebase/auth';
import type { Booking } from '@/types/booking';
import type { BookingRequest } from '@/types/bookingRequest';
import type { UserProfile } from '@/types/user';

jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/bookings', () => ({ getBookingsForMember: jest.fn(), cancelBooking: jest.fn() }));
jest.mock('@/lib/bookingRequests', () => ({ getBookingRequestsForMember: jest.fn() }));
jest.mock('@/lib/users', () => ({ deleteUserProfile: jest.fn() }));
jest.mock('firebase/auth', () => ({ deleteUser: jest.fn() }));
jest.mock('@/lib/firebase', () => ({ db: {}, auth: {} }));

const mockUseAuth = useAuth as jest.Mock;
const mockGetBookingsForMember = getBookingsForMember as jest.Mock;
const mockGetBookingRequestsForMember = getBookingRequestsForMember as jest.Mock;
const mockCancelBooking = cancelBooking as jest.Mock;
const mockDeleteUserProfile = deleteUserProfile as jest.Mock;
const mockDeleteUser = deleteUser as jest.Mock;

const mockUser = { uid: 'member-1' };

const memberProfile: Partial<UserProfile> = {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    role: 'member',
    membershipStatus: 'active',
    dateOfBirth: '1995-04-20',
    createdAt: '2025-01-15',
    address: { line1: '10 Elm St', townOrCity: 'Bristol', county: 'Bristol', postcode: 'BS1 1AB' },
};

function makeBooking(overrides: Partial<Booking>): Booking {
    return {
        id: 'b-1',
        memberId: 'member-1',
        memberName: 'Jane Smith',
        memberEmail: 'jane@example.com',
        facilityId: 'fac-1',
        facilityName: 'Tennis Court',
        activityDescription: 'Tennis',
        status: 'upcoming',
        date: '2030-06-01',
        slotStart: 480,
        slotEnd: 540,
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-01T10:00:00Z',
        ...overrides,
    };
}

function makeRequest(overrides: Partial<BookingRequest>): BookingRequest {
    return {
        id: 'r-1',
        memberId: 'member-1',
        memberName: 'Jane Smith',
        memberEmail: 'jane@example.com',
        facilityId: 'fac-1',
        facilityName: 'Tennis Court',
        activityDescription: 'Tennis',
        status: 'pending',
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-01T10:00:00Z',
        ...overrides,
    };
}

beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockUser, userProfile: memberProfile });
    mockGetBookingsForMember.mockResolvedValue([]);
    mockGetBookingRequestsForMember.mockResolvedValue([]);
    mockCancelBooking.mockResolvedValue(undefined);
    mockDeleteUserProfile.mockResolvedValue(undefined);
    mockDeleteUser.mockResolvedValue(undefined);
});

afterEach(() => { jest.clearAllMocks(); });

describe('MemberDashboard', () => {
    // ─── Rendering ────────────────────────────────────────────────────────────

    test('shows a welcome message with the member first name', () => {
        render(<MemberDashboard />);
        expect(screen.getByText(/Welcome back, Jane/)).toBeInTheDocument();
    });

    test('shows loading dashes while data is being fetched', () => {
        mockGetBookingsForMember.mockReturnValue(new Promise(() => {}));
        mockGetBookingRequestsForMember.mockReturnValue(new Promise(() => {}));
        render(<MemberDashboard />);
        expect(screen.getAllByText('—')).toHaveLength(2);
    });

    test('shows zero counts when there are no bookings or requests', async () => {
        render(<MemberDashboard />);
        await waitFor(() => {
            expect(screen.getAllByText('0')).toHaveLength(2);
        });
    });

    // ─── Stat cards ───────────────────────────────────────────────────────────

    test('counts active requests (pending, approved, alternative_suggested)', async () => {
        mockGetBookingRequestsForMember.mockResolvedValue([
            makeRequest({ id: 'r-1', status: 'pending' }),
            makeRequest({ id: 'r-2', status: 'approved' }),
            makeRequest({ id: 'r-3', status: 'alternative_suggested' }),
            makeRequest({ id: 'r-4', status: 'rejected' }), // should not count
        ]);
        render(<MemberDashboard />);
        await waitFor(() => {
            const activeCard = screen.getByText('Active requests').closest('div')!;
            expect(activeCard.querySelector('p')).toHaveTextContent('3');
        });
    });

    test('counts upcoming bookings (status = upcoming only)', async () => {
        mockGetBookingsForMember.mockResolvedValue([
            makeBooking({ id: 'b-1', status: 'upcoming', date: '2030-01-01' }),
            makeBooking({ id: 'b-2', status: 'upcoming', date: '2030-01-02' }),
            makeBooking({ id: 'b-3', status: 'completed', date: '2025-01-01' }), // should not count
        ]);
        render(<MemberDashboard />);
        await waitFor(() => {
            const upcomingCard = screen.getByText('Upcoming bookings').closest('div')!;
            expect(upcomingCard.querySelector('p')).toHaveTextContent('2');
        });
    });

    // ─── Today's bookings ─────────────────────────────────────────────────────

    test("shows an empty state when there are no bookings today", async () => {
        render(<MemberDashboard />);
        await screen.findByText("No bookings today.");
    });

    test("shows today's bookings by facility name", async () => {
        const today = new Date().toISOString().split('T')[0];
        mockGetBookingsForMember.mockResolvedValue([
            makeBooking({ id: 'b-1', status: 'upcoming', date: today, facilityName: 'Badminton Court' }),
        ]);
        render(<MemberDashboard />);
        await screen.findByText('Badminton Court');
    });

    test("shows the time slot for today's bookings", async () => {
        const today = new Date().toISOString().split('T')[0];
        mockGetBookingsForMember.mockResolvedValue([
            makeBooking({ id: 'b-1', status: 'upcoming', date: today, slotStart: 480, slotEnd: 540 }),
        ]);
        render(<MemberDashboard />);
        await screen.findByText('8:00 AM - 9:00 AM');
    });

    test("shows at most 3 bookings today", async () => {
        const today = new Date().toISOString().split('T')[0];
        const bookings = Array.from({ length: 5 }, (_, i) =>
            makeBooking({ id: `b-${i}`, status: 'upcoming', date: today, slotStart: 480 + i * 60, slotEnd: 540 + i * 60, facilityName: `Facility ${i}` })
        );
        mockGetBookingsForMember.mockResolvedValue(bookings);
        render(<MemberDashboard />);
        await screen.findByText('Facility 0');
        await waitFor(() => {
            expect(screen.getByText('Facility 2')).toBeInTheDocument();
            expect(screen.queryByText('Facility 3')).not.toBeInTheDocument();
        });
    });

    test("does not show bookings that are not today", async () => {
        const today = new Date().toISOString().split('T')[0];
        mockGetBookingsForMember.mockResolvedValue([
            makeBooking({ id: 'b-1', status: 'upcoming', date: today, facilityName: 'Today Court' }),
            makeBooking({ id: 'b-2', status: 'upcoming', date: '2030-12-01', facilityName: 'Future Court' }),
        ]);
        render(<MemberDashboard />);
        await screen.findByText('Today Court');
        expect(screen.queryByText('Future Court')).not.toBeInTheDocument();
    });

    // ─── Cancel booking ───────────────────────────────────────────────────────

    test('clicking Cancel calls cancelBooking with the booking id', async () => {
        const user = userEvent.setup();
        const today = new Date().toISOString().split('T')[0];
        mockGetBookingsForMember.mockResolvedValue([
            makeBooking({ id: 'booking-abc', status: 'upcoming', date: today }),
        ]);
        render(<MemberDashboard />);
        const cancelBtn = await screen.findByRole('button', { name: 'Cancel' });
        await user.click(cancelBtn);
        expect(mockCancelBooking).toHaveBeenCalledWith('booking-abc');
    });

    // ─── Cancel membership modal ──────────────────────────────────────────────

    test('a "Cancel membership" button is visible', async () => {
        render(<MemberDashboard />);
        await screen.findByText('No bookings today.');
        expect(screen.getByRole('button', { name: /cancel membership/i })).toBeInTheDocument();
    });

    test('clicking "Cancel membership" opens a confirmation modal', async () => {
        const user = userEvent.setup();
        render(<MemberDashboard />);
        await screen.findByText('No bookings today.');
        await user.click(screen.getByRole('button', { name: /cancel membership/i }));
        expect(screen.getByText(/permanently delete your account/i)).toBeInTheDocument();
    });

    test('"Go back" button closes the confirmation modal', async () => {
        const user = userEvent.setup();
        render(<MemberDashboard />);
        await screen.findByText('No bookings today.');
        await user.click(screen.getByRole('button', { name: /cancel membership/i }));
        await user.click(screen.getByRole('button', { name: /go back/i }));
        expect(screen.queryByText(/permanently delete your account/i)).not.toBeInTheDocument();
    });

    test('clicking backdrop closes the confirmation modal', async () => {
        const user = userEvent.setup();
        render(<MemberDashboard />);
        await screen.findByText('No bookings today.');
        await user.click(screen.getByRole('button', { name: /cancel membership/i }));
        // Click the backdrop (the outermost fixed div, which is the modal overlay)
        const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
        await user.click(backdrop);
        expect(screen.queryByText(/permanently delete your account/i)).not.toBeInTheDocument();
    });

    test('confirming deletion calls deleteUserProfile then deleteUser', async () => {
        const user = userEvent.setup();
        render(<MemberDashboard />);
        await screen.findByText('No bookings today.');
        await user.click(screen.getByRole('button', { name: /cancel membership/i }));
        await user.click(screen.getByRole('button', { name: /^yes$/i }));
        expect(mockDeleteUserProfile).toHaveBeenCalledWith('member-1');
        expect(mockDeleteUser).toHaveBeenCalledWith(mockUser);
    });
});
