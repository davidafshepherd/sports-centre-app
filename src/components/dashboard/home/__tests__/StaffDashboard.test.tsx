import { render, screen, waitFor } from '@testing-library/react';
import StaffDashboard from '../StaffDashboard';
import { useAuth } from '@/providers/AuthProvider';
import { getBookingsForStaff } from '@/lib/bookings';
import { getBookingRequestsForStaff } from '@/lib/bookingRequests';
import type { Booking } from '@/types/booking';
import type { BookingRequest } from '@/types/bookingRequest';
import type { UserProfile } from '@/types/user';

jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/bookings', () => ({ getBookingsForStaff: jest.fn() }));
jest.mock('@/lib/bookingRequests', () => ({ getBookingRequestsForStaff: jest.fn() }));
jest.mock('@/lib/firebase', () => ({ db: {}, auth: {} }));

const mockUseAuth = useAuth as jest.Mock;
const mockGetBookingsForStaff = getBookingsForStaff as jest.Mock;
const mockGetBookingRequestsForStaff = getBookingRequestsForStaff as jest.Mock;

const staffProfile: Partial<UserProfile> = {
    firstName: 'Carlos',
    lastName: 'Staff',
    email: 'carlos@gym.com',
    role: 'staff',
    membershipStatus: 'active',
    dateOfBirth: '1992-07-10',
    createdAt: '2025-03-01',
    address: { line1: '5 Gym Lane', townOrCity: 'Manchester', county: 'Greater Manchester', postcode: 'M1 1AE' },
};

function makeBooking(overrides: Partial<Booking>): Booking {
    return {
        id: 'b-1',
        memberId: 'member-1',
        memberName: 'Alice Member',
        memberEmail: 'alice@example.com',
        facilityId: 'fac-1',
        facilityName: 'Swimming Pool',
        activityDescription: 'Lane swimming',
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
        memberName: 'Alice Member',
        memberEmail: 'alice@example.com',
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
    mockUseAuth.mockReturnValue({ user: { uid: 'staff-1' }, userProfile: staffProfile });
    mockGetBookingsForStaff.mockResolvedValue([]);
    mockGetBookingRequestsForStaff.mockResolvedValue([]);
});

afterEach(() => { jest.clearAllMocks(); });

describe('StaffDashboard', () => {
    test('shows a welcome message with the staff first name', () => {
        render(<StaffDashboard />);
        expect(screen.getByText(/Welcome back, Carlos/)).toBeInTheDocument();
    });

    test('shows loading dashes while data is being fetched', () => {
        mockGetBookingsForStaff.mockReturnValue(new Promise(() => {}));
        mockGetBookingRequestsForStaff.mockReturnValue(new Promise(() => {}));
        render(<StaffDashboard />);
        expect(screen.getAllByText('—')).toHaveLength(2);
    });

    test('shows zero counts when there are no requests or sessions', async () => {
        render(<StaffDashboard />);
        await waitFor(() => {
            expect(screen.getAllByText('0')).toHaveLength(2);
        });
    });

    test('shows the pending request count', async () => {
        mockGetBookingRequestsForStaff.mockResolvedValue([
            makeRequest({ id: 'r-1', status: 'pending' }),
            makeRequest({ id: 'r-2', status: 'pending' }),
        ]);
        render(<StaffDashboard />);
        await waitFor(() => {
            const pendingCard = screen.getByText('Pending requests').closest('div')!;
            expect(pendingCard.querySelector('p')).toHaveTextContent('2');
        });
    });

    test('only counts pending requests (not approved or rejected)', async () => {
        mockGetBookingRequestsForStaff.mockResolvedValue([
            makeRequest({ id: 'r-1', status: 'pending' }),
            makeRequest({ id: 'r-2', status: 'approved' }),
            makeRequest({ id: 'r-3', status: 'rejected' }),
        ]);
        render(<StaffDashboard />);
        await waitFor(() => {
            const pendingCard = screen.getByText('Pending requests').closest('div')!;
            expect(pendingCard.querySelector('p')).toHaveTextContent('1');
        });
    });

    test('shows the upcoming sessions count', async () => {
        mockGetBookingsForStaff.mockResolvedValue([
            makeBooking({ id: 'b-1', status: 'upcoming' }),
            makeBooking({ id: 'b-2', status: 'upcoming' }),
            makeBooking({ id: 'b-3', status: 'completed' }),
        ]);
        render(<StaffDashboard />);
        await waitFor(() => {
            const upcomingCard = screen.getByText('Upcoming sessions').closest('div')!;
            expect(upcomingCard.querySelector('p')).toHaveTextContent('2');
        });
    });

    test("shows an empty state when there are no sessions today", async () => {
        render(<StaffDashboard />);
        await screen.findByText("No sessions today.");
    });

    test("shows today's sessions", async () => {
        const today = new Date().toISOString().split('T')[0];
        mockGetBookingsForStaff.mockResolvedValue([
            makeBooking({ id: 'b-1', status: 'upcoming', date: today, facilityName: 'Squash Court' }),
        ]);
        render(<StaffDashboard />);
        await screen.findByText('Squash Court');
    });

    test("shows the member name alongside today's session", async () => {
        const today = new Date().toISOString().split('T')[0];
        mockGetBookingsForStaff.mockResolvedValue([
            makeBooking({ id: 'b-1', status: 'upcoming', date: today, memberName: 'Diana Member' }),
        ]);
        render(<StaffDashboard />);
        await screen.findByText(/Diana Member/);
    });

    test("shows at most 3 sessions today", async () => {
        const today = new Date().toISOString().split('T')[0];
        const bookings = Array.from({ length: 5 }, (_, i) =>
            makeBooking({ id: `b-${i}`, status: 'upcoming', date: today, slotStart: 480 + i * 60, slotEnd: 540 + i * 60, facilityName: `Facility ${i}` })
        );
        mockGetBookingsForStaff.mockResolvedValue(bookings);
        render(<StaffDashboard />);
        await screen.findByText('Facility 0');
        await waitFor(() => {
            expect(screen.getByText('Facility 2')).toBeInTheDocument();
            expect(screen.queryByText('Facility 3')).not.toBeInTheDocument();
        });
    });

    test("does not show a 'Cancel' button on sessions", async () => {
        const today = new Date().toISOString().split('T')[0];
        mockGetBookingsForStaff.mockResolvedValue([
            makeBooking({ id: 'b-1', status: 'upcoming', date: today }),
        ]);
        render(<StaffDashboard />);
        await screen.findByText('Swimming Pool');
        expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
});
