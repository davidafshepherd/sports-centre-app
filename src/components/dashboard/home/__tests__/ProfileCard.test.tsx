import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileCard from '../ProfileCard';
import { useAuth } from '@/providers/AuthProvider';
import { updateUserProfile } from '@/lib/users';
import type { UserProfile } from '@/types/user';

jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/users', () => ({ updateUserProfile: jest.fn() }));
jest.mock('@/lib/firebase', () => ({ db: {}, auth: {} }));

const mockUseAuth = useAuth as jest.Mock;
const mockUpdateUserProfile = updateUserProfile as jest.Mock;

const mockUser = { uid: 'user-1' };

const mockProfile: UserProfile = {
    uid: 'user-1',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    role: 'member',
    membershipStatus: 'active',
    dateOfBirth: '1990-05-01',
    createdAt: '2025-01-01',
    address: {
        line1: '42 Baker St',
        line2: 'Flat 3',
        townOrCity: 'London',
        county: 'Greater London',
        postcode: 'NW1 6XE',
    },
};

beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockUser, userProfile: mockProfile });
    mockUpdateUserProfile.mockResolvedValue(undefined);
});

afterEach(() => { jest.clearAllMocks(); });

describe('ProfileCard — view mode', () => {
    test('displays the initials avatar', () => {
        render(<ProfileCard />);
        expect(screen.getByText('JS')).toBeInTheDocument();
    });

    test('displays the full name', () => {
        render(<ProfileCard />);
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    test('displays the email address', () => {
        render(<ProfileCard />);
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    test('displays the membership status badge', () => {
        render(<ProfileCard />);
        expect(screen.getByText('active')).toBeInTheDocument();
    });

    test('displays the role', () => {
        render(<ProfileCard />);
        expect(screen.getByText('member')).toBeInTheDocument();
    });

    test('displays the date of birth', () => {
        render(<ProfileCard />);
        expect(screen.getByText('1990-05-01')).toBeInTheDocument();
    });

    test('displays "Member since" with the join year', () => {
        render(<ProfileCard />);
        expect(screen.getByText(/January 2025/i)).toBeInTheDocument();
    });

    test('displays the address street', () => {
        render(<ProfileCard />);
        expect(screen.getByText(/42 Baker St/)).toBeInTheDocument();
    });

    test('displays the town/city', () => {
        render(<ProfileCard />);
        expect(screen.getByText('London')).toBeInTheDocument();
    });

    test('displays the postcode', () => {
        render(<ProfileCard />);
        expect(screen.getByText('NW1 6XE')).toBeInTheDocument();
    });

    test('shows the "Edit profile" button', () => {
        render(<ProfileCard />);
        expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });

    test('shows "?" as initials when profile is empty', () => {
        mockUseAuth.mockReturnValue({ user: mockUser, userProfile: null });
        render(<ProfileCard />);
        expect(screen.getByText('?')).toBeInTheDocument();
    });
});

describe('ProfileCard — edit mode', () => {
    test('clicking "Edit profile" opens the edit form', async () => {
        const user = userEvent.setup();
        render(<ProfileCard />);
        await user.click(screen.getByRole('button', { name: /edit profile/i }));
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    test('edit form is pre-filled with the current first name', async () => {
        const user = userEvent.setup();
        render(<ProfileCard />);
        await user.click(screen.getByRole('button', { name: /edit profile/i }));
        expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
    });

    test('edit form is pre-filled with the current last name', async () => {
        const user = userEvent.setup();
        render(<ProfileCard />);
        await user.click(screen.getByRole('button', { name: /edit profile/i }));
        expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
    });

    test('edit form is pre-filled with the current date of birth', async () => {
        const user = userEvent.setup();
        render(<ProfileCard />);
        await user.click(screen.getByRole('button', { name: /edit profile/i }));
        expect(screen.getByDisplayValue('1990-05-01')).toBeInTheDocument();
    });

    test('edit form is pre-filled with the current address line 1', async () => {
        const user = userEvent.setup();
        render(<ProfileCard />);
        await user.click(screen.getByRole('button', { name: /edit profile/i }));
        expect(screen.getByDisplayValue('42 Baker St')).toBeInTheDocument();
    });

    test('"Save changes" is disabled when the form is pristine', async () => {
        const user = userEvent.setup();
        render(<ProfileCard />);
        await user.click(screen.getByRole('button', { name: /edit profile/i }));
        expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
    });

    test('"Save changes" becomes enabled after a valid field change', async () => {
        const user = userEvent.setup();
        render(<ProfileCard />);
        await user.click(screen.getByRole('button', { name: /edit profile/i }));
        const firstNameInput = screen.getByDisplayValue('Jane');
        await user.clear(firstNameInput);
        await user.type(firstNameInput, 'Janet');
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled();
        });
    });

    test('"Save changes" is disabled when a required field is cleared', async () => {
        const user = userEvent.setup();
        render(<ProfileCard />);
        await user.click(screen.getByRole('button', { name: /edit profile/i }));
        const firstNameInput = screen.getByDisplayValue('Jane');
        await user.clear(firstNameInput);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
        });
    });

    test('"Cancel" button closes the edit form', async () => {
        const user = userEvent.setup();
        render(<ProfileCard />);
        await user.click(screen.getByRole('button', { name: /edit profile/i }));
        await user.click(screen.getByRole('button', { name: /^cancel$/i }));
        expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
    });

    test('submitting the form calls updateUserProfile with the new values', async () => {
        const user = userEvent.setup();
        render(<ProfileCard />);
        await user.click(screen.getByRole('button', { name: /edit profile/i }));
        const firstNameInput = screen.getByDisplayValue('Jane');
        await user.clear(firstNameInput);
        await user.type(firstNameInput, 'Janet');
        await waitFor(() => expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled());
        await user.click(screen.getByRole('button', { name: /save changes/i }));
        await waitFor(() => {
            expect(mockUpdateUserProfile).toHaveBeenCalledWith('user-1', expect.objectContaining({ firstName: 'Janet' }));
        });
    });

    test('edit form is hidden after a successful save', async () => {
        const user = userEvent.setup();
        render(<ProfileCard />);
        await user.click(screen.getByRole('button', { name: /edit profile/i }));
        const firstNameInput = screen.getByDisplayValue('Jane');
        await user.clear(firstNameInput);
        await user.type(firstNameInput, 'Janet');
        await waitFor(() => expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled());
        await user.click(screen.getByRole('button', { name: /save changes/i }));
        await waitFor(() => {
            expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
        });
    });
});
