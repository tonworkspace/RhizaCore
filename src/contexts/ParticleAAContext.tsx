import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  SmartAccount,
  type IEthereumProvider,
  type SmartAccountConfig,
} from '@particle-network/aa';

type ParticleAAStatus = 'idle' | 'loading' | 'ready' | 'error';

interface ParticleAAContextValue {
  smartAccount: SmartAccount | null;
  status: ParticleAAStatus;
  error: string | null;
  isConfigured: boolean;
  initializeSmartAccount: (provider: IEthereumProvider) => Promise<SmartAccount>;
  reset: () => void;
}

const ParticleAAContext = createContext<ParticleAAContextValue>({
  smartAccount: null,
  status: 'idle',
  error: null,
  isConfigured: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  initializeSmartAccount: async () => {
    throw new Error('ParticleAAProvider is not mounted');
  },
  reset: () => {},
});

interface ParticleAAProviderProps {
  children: ReactNode;
}

const PARTICLE_PROJECT_ID = import.meta.env.VITE_PARTICLE_PROJECT_ID ?? '03d95eaa-1827-4a77-b48b-7a843b58ad4b';
const PARTICLE_CLIENT_KEY = import.meta.env.VITE_PARTICLE_CLIENT_KEY ?? 'cBrWkx5HLafxEdQ9NVrFGUXA9zYQ38bYOL1JhVd4';
const PARTICLE_APP_ID = import.meta.env.VITE_PARTICLE_APP_ID ?? 'cbaa01ef-7f6a-462b-9f22-26e83a3ffdde';
const PARTICLE_ACCOUNT_NAME = import.meta.env.VITE_PARTICLE_ACCOUNT_NAME ?? 'BICONOMY';
const PARTICLE_ACCOUNT_VERSION = import.meta.env.VITE_PARTICLE_ACCOUNT_VERSION ?? '2.0.0';
const PARTICLE_ACCOUNT_CHAIN_IDS = import.meta.env.VITE_PARTICLE_ACCOUNT_CHAIN_IDS ?? '';

const parseChainIds = (chainIds: string) =>
  chainIds
    .split(',')
    .map((id) => Number(id.trim()))
    .filter((id) => !Number.isNaN(id));

export const ParticleAAProvider = ({ children }: ParticleAAProviderProps) => {
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null);
  const [status, setStatus] = useState<ParticleAAStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const isConfigured = Boolean(
    PARTICLE_PROJECT_ID && PARTICLE_CLIENT_KEY && PARTICLE_APP_ID,
  );

  const config = useMemo<SmartAccountConfig | null>(() => {
    if (!isConfigured) return null;

    const chainIds = parseChainIds(PARTICLE_ACCOUNT_CHAIN_IDS);
    const accountContracts = [
      {
        version: PARTICLE_ACCOUNT_VERSION,
        ...(chainIds.length ? { chainIds } : {}),
      },
    ];

    return {
      projectId: PARTICLE_PROJECT_ID,
      clientKey: PARTICLE_CLIENT_KEY,
      appId: PARTICLE_APP_ID,
      aaOptions: {
        accountContracts: {
          [PARTICLE_ACCOUNT_NAME]: accountContracts,
        },
      },
    };
  }, [isConfigured]);

  const initializeSmartAccount = useCallback(
    async (provider: IEthereumProvider) => {
      if (!isConfigured || !config) {
        throw new Error(
          'Particle Network credentials are missing. Please set VITE_PARTICLE_PROJECT_ID, VITE_PARTICLE_CLIENT_KEY, and VITE_PARTICLE_APP_ID.',
        );
      }

      if (!provider) {
        throw new Error('An EIP-1193 compatible provider is required to initialize Particle AA.');
      }

      setStatus('loading');
      setError(null);

      try {
        const instance = new SmartAccount(provider, config);
        instance.setSmartAccountContract({
          name: PARTICLE_ACCOUNT_NAME,
          version: PARTICLE_ACCOUNT_VERSION,
        });
        setSmartAccount(instance);
        setStatus('ready');
        return instance;
      } catch (err) {
        console.error('Failed to initialize Particle SmartAccount:', err);
        const message = err instanceof Error ? err.message : 'Unknown error while initializing SmartAccount';
        setError(message);
        setStatus('error');
        throw err;
      }
    },
    [config, isConfigured],
  );

  const reset = useCallback(() => {
    setSmartAccount(null);
    setStatus('idle');
    setError(null);
  }, []);

  const value = useMemo<ParticleAAContextValue>(
    () => ({
      smartAccount,
      status,
      error,
      isConfigured,
      initializeSmartAccount,
      reset,
    }),
    [smartAccount, status, error, isConfigured, initializeSmartAccount, reset],
  );

  return (
    <ParticleAAContext.Provider value={value}>
      {children}
    </ParticleAAContext.Provider>
  );
};

export const useParticleAA = () => useContext(ParticleAAContext);

