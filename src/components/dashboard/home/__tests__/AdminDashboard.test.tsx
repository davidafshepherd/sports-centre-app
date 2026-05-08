import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '../AdminDashboard';
import { useAuth } from '@/providers/AuthProvider';
import { getStaffUsers } from '@/lib/users';
import type { UserProfile } from '@/types/user';

jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/users', () => ({ getStaffUsers: jest.fn() }));
jest.mock('@/lib/firebase', () => ({ db: {}, auth: {} }));

const mockUseAuth = useAuth as jest.Mock;
const mockGetStaffUsers = getStaffUsers as jest.Mock;

const adminProfile: Partial<UserProfile> = {
    firstName: 'Alice',
    lastName: 'Admin',
    email: 'alice@gym.com',
    role: 'admin',
    membershipStatus: 'active',
    dateOfBirth: '1985-03-20',
    createdAt: '2024-01-01',
    address: { line1: '1 Office Rd', townOrCity: 'London', county: 'Greater London', postcode: 'EC1A 1BB' },
};

function makeStaff(overrides: Partial<UserProfile>): UserProfile {
    return {
        uid: 'staff-1',
        firstName: 'Bob',
        lastName: 'Staff',
        email: 'bob@gym.com',
        role: 'staff',
        membershipStatus: 'active',
        dateOfBirth: '1990-01-01',
        createdAt: '2024-06-01',
        address: { line1: '2 Work St', townOrCity: 'London', county: 'Greater London', postcode: 'W1A 1AA' },
        ...overrides,
    };
}

beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { uid: 'admin-1' }, userProfile: adminProfile });
    mockGetStaffUsers.mockResolvedValue([]);
});

afterEach(() => { jest.clearAllMocks(); });

describe('AdminDashboard', () => {
    test('shows a welcome message with the admin first name', () => {
        render(<AdminDashboard />);
        expect(screen.getByText(/Welcome back, Alice/)).toBeInTheDocument();
    });

    test('shows loading dashes while data is being fetched', () => {
        mockGetStaffUsers.mockReturnValue(new Promise(() => {})); // never resolves
        render(<AdminDashboard />);
        expect(screen.getAllByText('—')).toHaveLength(3);
    });

    test('shows zero counts when there are no staff', async () => {
        render(<AdminDashboard />);
        await waitFor(() => {
            expect(screen.getAllByText('0')).toHaveLength(3);
        });
    });

    test('counts active staff correctly', async () => {
        mockGetStaffUsers.mockResolvedValue([
            makeStaff({ uid: 'a', membershipStatus: 'active' }),
            makeStaff({ uid: 'b', membershipStatus: 'active' }),
        ]);
        render(<AdminDashboard />);
        await waitFor(() => {
            expect(screen.getByText('Active')).toBeInTheDocument();
        });
        const activeCard = screen.getByText('Active').closest('div')!;
        expect(activeCard.querySelector('p')).toHaveTextContent('2');
    });

    test('counts pending staff correctly', async () => {
        mockGetStaffUsers.mockResolvedValue([
            makeStaff({ uid: 'a', membershipStatus: 'pending' }),
        ]);
        render(<AdminDashboard />);
        await waitFor(() => {
            expect(screen.getByText('Pending')).toBeInTheDocument();
        });
        const pendingCard = screen.getByText('Pending').closest('div')!;
        expect(pendingCard.querySelector('p')).toHaveTextContent('1');
    });

    test('counts suspended staff correctly', async () => {
        mockGetStaffUsers.mockResolvedValue([
            makeStaff({ uid: 'a', membershipStatus: 'suspended' }),
            makeStaff({ uid: 'b', membershipStatus: 'suspended' }),
            makeStaff({ uid: 'c', membershipStatus: 'suspended' }),
        ]);
        render(<AdminDashboard />);
        await waitFor(() => {
            expect(screen.getByText('Suspended')).toBeInTheDocument();
        });
        const suspendedCard = screen.getByText('Suspended').closest('div')!;
        expect(suspendedCard.querySelector('p')).toHaveTextContent('3');
    });

    test('excludes cancelled staff from all counts', async () => {
        mockGetStaffUsers.mockResolvedValue([
            makeStaff({ uid: 'a', membershipStatus: 'cancelled' }),
            makeStaff({ uid: 'b', membershipStatus: 'active' }),
        ]);
        render(<AdminDashboard />);
        await waitFor(() => {
            expect(screen.getByText('Active')).toBeInTheDocument();
        });
        const activeCard = screen.getByText('Active').closest('div')!;
        expect(activeCard.querySelector('p')).toHaveTextContent('1');
    });

    test('includes a "Manage staff" link to /staff', async () => {
        render(<AdminDashboard />);
        const link = screen.getByRole('link', { name: /manage staff/i });
        expect(link).toHaveAttribute('href', '/staff');
    });
});
