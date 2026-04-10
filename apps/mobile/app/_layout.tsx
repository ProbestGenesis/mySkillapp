import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUniwind } from 'uniwind';
import { AppProvider } from '@/provider/appProvider';
export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { theme } = useUniwind();

  return (
    <ThemeProvider value={NAV_THEME[theme ?? 'light']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <AppProvider>
      <Stack>
          <Stack.Screen name='(tabs)' options={{headerShown: false}} />
          <Stack.Screen name='auth' options={{headerShown: false}} />
      </Stack>
      <PortalHost />
      </AppProvider>
    </ThemeProvider>
  );
}
