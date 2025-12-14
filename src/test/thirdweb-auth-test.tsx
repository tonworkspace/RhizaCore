import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThirdwebAuthProvider, useThirdwebAuth } from '@/contexts/ThirdwebAuthContext';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/pages/AuthPage';
import WalletOnboarding from '@/components/WalletOnboarding';

// Mock the thirdweb hooks
vi.mock('thirdweb/react', () => ({
  useActiveAccount: vi.fn(),
  useActiveWallet: vi.fn(),
  useDisconnect: vi.fn(),
  useConnect: vi.fn(),
  ConnectButton: vi.fn(({ children }) => <button>{children}</button>),
  ConnectEmbed: vi.fn(() => <div>ConnectEmbed</div>),
}));

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock the client
vi.mock('@/lib/client', () => ({
  client: {},
}));

describe('Thirdweb Authentication Integration', () => {
  const mockUser = {
    id: 1,
    telegram_id: '12345',
    username: 'test_user',
    first_name: 'Test',
    last_name: 'User',
  };

  const mockThirdwebAccount = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    chain: { name: 'BSC Testnet' },
  };

  const mockThirdwebWallet = {
    // Mock wallet properties
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('ThirdwebAuthContext', () => {
    it('should provide thirdweb authentication context', () => {
      const TestComponent = () => {
        const context = useThirdwebAuth();
        return <div>Context available</div>;
      };

      render(
        <ThirdwebAuthProvider>
          <TestComponent />
        </ThirdwebAuthProvider>
      );

      expect(screen.getByText('Context available')).toBeInTheDocument();
    });
  });

  describe('AuthPage Component', () => {
    it('should render loading state initially', () => {
      // Mock useAuth to return loading state
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: true,
        error: null,
      });

      render(
        <ThirdwebAuthProvider>
          <AuthPage />
        </ThirdwebAuthProvider>
      );

      expect(screen.getByText('Loading authentication...')).toBeInTheDocument();
    });

    it('should show Telegram authentication step when no user', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });

      render(
        <ThirdwebAuthProvider>
          <AuthPage />
        </ThirdwebAuthProvider>
      );

      expect(screen.getByText('Step 1: Telegram Authentication')).toBeInTheDocument();
    });

    it('should show thirdweb connection step when user exists but no thirdweb connection', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isLoading: false,
        error: null,
      });

      // Mock thirdweb hooks to return no connection
      vi.mocked(useActiveAccount).mockReturnValue(null);
      vi.mocked(useActiveWallet).mockReturnValue(null);

      render(
        <ThirdwebAuthProvider>
          <AuthPage />
        </ThirdwebAuthProvider>
      );

      expect(screen.getByText('Step 2: Thirdweb Wallet Connection')).toBeInTheDocument();
    });
  });

  describe('WalletOnboarding Component', () => {
    it('should show loading state when checking connection', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isLoading: false,
        error: null,
      });

      // Mock thirdweb hooks to return loading state
      vi.mocked(useActiveAccount).mockReturnValue(undefined);
      vi.mocked(useActiveWallet).mockReturnValue(undefined);

      render(
        <ThirdwebAuthProvider>
          <WalletOnboarding />
        </ThirdwebAuthProvider>
      );

      expect(screen.getByText('Loading wallet...')).toBeInTheDocument();
    });

    it('should show connected state when thirdweb is connected', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isLoading: false,
        error: null,
      });

      // Mock thirdweb hooks to return connected state
      vi.mocked(useActiveAccount).mockReturnValue(mockThirdwebAccount);
      vi.mocked(useActiveWallet).mockReturnValue(mockThirdwebWallet);

      render(
        <ThirdwebAuthProvider>
          <WalletOnboarding />
        </ThirdwebAuthProvider>
      );

      expect(screen.getByText('✓ Connected')).toBeInTheDocument();
      expect(screen.getByText('123456...5678')).toBeInTheDocument();
    });

    it('should show connect button when not connected', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isLoading: false,
        error: null,
      });

      // Mock thirdweb hooks to return no connection
      vi.mocked(useActiveAccount).mockReturnValue(null);
      vi.mocked(useActiveWallet).mockReturnValue(null);

      render(
        <ThirdwebAuthProvider>
          <WalletOnboarding />
        </ThirdwebAuthProvider>
      );

      expect(screen.getByText('Connect Thirdweb Wallet')).toBeInTheDocument();
    });
  });
});