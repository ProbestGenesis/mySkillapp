import { Stack } from 'expo-router';

type Props = {};
function ProvidersLayout({}: Props) {
  return (
      <Stack>
          <Stack.Screen name='index' options={{ 
            title: "prestataires"
         }} />
        <Stack.Screen
          name="[providerId]"
          options={{
              title: 'Contacter',
              headerShown: false
          }}
        />
      </Stack>
  );
}
export default ProvidersLayout;
