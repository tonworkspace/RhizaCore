import { useLaunchParams, miniApp, useSignal } from '@telegram-apps/sdk-react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { Navigate, Route, Routes, HashRouter } from 'react-router-dom';
import { PriceProvider } from '@/contexts/PriceContext';
import { routes } from '@/navigation/routes.tsx';
// import { ParticleAAProvider } from '@/contexts/ParticleAAContext';
// import { AuthProvider } from '@/contexts/AuthContext';




export function App() {
  const lp = useLaunchParams();
  const isDark = useSignal(miniApp.isDark);

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={['macos', 'ios'].includes(lp.platform) ? 'ios' : 'base'}
    >
       {/* <AuthCoreContextProvider
          options={{
           projectId: import.meta.env.VITE_PARTICLE_PROJECT_ID ?? '03d95eaa-1827-4a77-b48b-7a843b58ad4b',
           clientKey: import.meta.env.VITE_PARTICLE_CLIENT_KEY ?? 'cBrWkx5HLafxEdQ9NVrFGUXA9zYQ38bYOL1JhVd4',
           appId: import.meta.env.VITE_PARTICLE_APP_ID ?? 'cbaa01ef-7f6a-462b-9f22-26e83a3ffdde',
            chains: [mainnet],
            authTypes: [AuthType.email, AuthType.google, AuthType.twitter],
            themeType: "dark", // Login modal theme
            fiatCoin: "USD",
            language: "en",
            // optional, ERC4337
            erc4337: {
              name: "SIMPLE",
              version: "2.0.0",
            },
            // You can prompt the user to set up extra security measure upon login or other interactions
            promptSettingConfig: {
              promptPaymentPasswordSettingWhenSign: PromptSettingType.first,
              promptMasterPasswordSettingWhenLogin: PromptSettingType.first,
            },
            wallet: {
              themeType: 'dark', // Wallet modal theme
              visible: true,
              customStyle: {
                displayTokenAddresses: ["0x4d224452801ACEd8B2F0aebE155379bb5D594381"], // Display a custom token within the wallet modal
                priorityTokenAddresses: ["0x4d224452801ACEd8B2F0aebE155379bb5D594381"],
               },
            },
          }}
        > */}
            {/* <AuthProvider> */}
        {/* <ParticleAAProvider> */}
          <PriceProvider>
            <HashRouter>
              <Routes>
                {routes.map((route) => <Route key={route.path} {...route} />)}
              <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </HashRouter>
          </PriceProvider>
        {/* </ParticleAAProvider> */}
        {/* </AuthProvider> */}

      {/* </AuthCoreContextProvider> */}
    </AppRoot>
  );
}


export default App;
