import { Stack } from 'expo-router';

type Props = {};
function ProvidersLayout({}: Props) {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'prestataires',
        }}
      />
      <Stack.Screen
        name="[providerId]"
        options={{
          title: 'Contacter',
        }}
      />
    </Stack>
  );
}
export default ProvidersLayout;
