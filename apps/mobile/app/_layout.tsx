import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUniwind } from 'uniwind';
import { usePersistUserLocation } from '@/lib/usePersistUserLocation';
import { AppProvider } from '@/provider/appProvider';
import { authClient, useSession } from '@/lib/auth-client';
import { ActivityIndicator, View } from 'react-native';
import { useEffect } from 'react';
export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

function TrpcTree() {
  usePersistUserLocation();
  const { data: sesison, isPending } = authClient.useSession()

  if(isPending){
    return <View   className="flex-1 items-center justify-center"> 
          <ActivityIndicator size={"large"} />
    </View>
  }
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name='provider' options={{ headerShown: false}}  />
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
