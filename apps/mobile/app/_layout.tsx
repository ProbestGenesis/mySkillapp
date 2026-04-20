import '@/global.css';

import { authClient } from '@/lib/auth-client';
import { NAV_THEME } from '@/lib/theme';
import { usePersistUserLocation } from '@/lib/usePersistUserLocation';
import { AppProvider } from '@/provider/appProvider';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { useUniwind } from 'uniwind';
export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

function TrpcTree() {
  usePersistUserLocation();

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="provider" options={{ headerShown: false }} />
      </Stack>
      <PortalHost />
    </>
  );
}

export default function RootLayout() {
  const { theme } = useUniwind();

  return (
    <ThemeProvider value={NAV_THEME[theme ?? 'light']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <AppProvider>
        <TrpcTree />
      </AppProvider>
    </ThemeProvider>
  );
}
