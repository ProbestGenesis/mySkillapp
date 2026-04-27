import { Button } from '@/components/ui/button';
import { Stack, Link } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

type Props = {};
function ProviderLayout({}: Props) {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Profile',
          headerBackVisible: false,
          headerLeft: () => (
            <Link asChild href="/">
              <Button variant={'ghost'} size={"iconSm"} className='me-4 rounded-full'>
                <ArrowLeft />
              </Button>
            </Link>
          ),
        }}
      />
      <Stack.Screen
        name="contact"
        options={{
          title: 'Contacter',
          headerBackVisible: false,
          headerLeft: () => (
            <Link asChild href="/">
              <Button variant={'ghost'} size={"iconSm"} className='me-4'>
                <ArrowLeft />
              </Button>
            </Link>
          ),
        }}
      />=4
    </Stack>
  );
}
export default ProviderLayout;
