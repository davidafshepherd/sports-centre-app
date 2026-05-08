import { render, screen } from '@testing-library/react';
import DashboardView from '../DashboardView';
import { useAuth } from '@/providers/AuthProvider';

jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/firebase', () => ({ db: {}, auth: {} }));

// Stub out the three dashboard components so that this test only covers the routing logic
jest.mock('@/components/dashboard/home/AdminDashboard', () => () => <div>AdminDashboard</div>);
jest.mock('@/components/dashboard/home/StaffDashboard', () => () => <div>StaffDashboard</div>);
jest.mock('@/components/dashboard/home/MemberDashboard', () => () => <div>MemberDashboard</div>);

const mockUseAuth = useAuth as jest.Mock;

afterEach(() => { jest.clearAllMocks(); });

describe('DashboardView', () => {
    test('renders AdminDashboard for the admin role', () => {
        mockUseAuth.mockReturnValue({ userProfile: { role: 'admin' } });
        render(<DashboardView />);
        expect(screen.getByText('AdminDashboard')).toBeInTheDocument();
        expect(screen.queryByText('StaffDashboard')).not.toBeInTheDocument();
        expect(screen.queryByText('MemberDashboard')).not.toBeInTheDocument();
    });

    test('renders StaffDashboard for the staff role', () => {
        mockUseAuth.mockReturnValue({ userProfile: { role: 'staff' } });
        render(<DashboardView />);
        expect(screen.getByText('StaffDashboard')).toBeInTheDocument();
        expect(screen.queryByText('AdminDashboard')).not.toBeInTheDocument();
        expect(screen.queryByText('MemberDashboard')).not.toBeInTheDocument();
    });

    test('renders MemberDashboard for the member role', () => {
        mockUseAuth.mockReturnValue({ userProfile: { role: 'member' } });
        render(<DashboardView />);
        expect(screen.getByText('MemberDashboard')).toBeInTheDocument();
        expect(screen.queryByText('AdminDashboard')).not.toBeInTheDocument();
        expect(screen.queryByText('StaffDashboard')).not.toBeInTheDocument();
    });

    test('defaults to MemberDashboard when userProfile is null', () => {
        mockUseAuth.mockReturnValue({ userProfile: null });
        render(<DashboardView />);
        expect(screen.getByText('MemberDashboard')).toBeInTheDocument();
    });

    test('defaults to MemberDashboard for an unrecognised role', () => {
        mockUseAuth.mockReturnValue({ userProfile: { role: 'unknown' } });
        render(<DashboardView />);
        expect(screen.getByText('MemberDashboard')).toBeInTheDocument();
    });
});
