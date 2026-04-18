import { Stack } from 'expo-router';

type Props = {};
function ProviderLayout({}: Props) {
  return (
      <Stack>
        <Stack.Screen
          name="contact"
          options={{
            title: 'Contacter',
          }}
        />
      </Stack>
  );
}
export default ProviderLayout;
