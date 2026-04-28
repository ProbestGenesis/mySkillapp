import { Button } from '@/components/ui/button';
import { Link, Stack } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

type Props = {};

export default function ReelsLayout({}: Props) {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="upload/index"
        options={{
          title: 'Ajouter un reel',
          headerLeft: () => (
            <Link href="/(tabs)/reels" asChild className='me-4'>
              <Button variant={"ghost"} size={"icon"}>
                <ArrowLeft />
              </Button>
            </Link>
          )
        }}
      />
    </Stack>
  );
}
