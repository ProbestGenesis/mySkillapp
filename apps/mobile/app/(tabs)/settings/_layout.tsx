import { Stack, Link } from 'expo-router';
import { ArrowLeft } from "lucide-react-native"
import { Button } from "@/components/ui/button"

type Props = {};
function SettingLayout({}: Props) {
  return (
    <Stack screenOptions={{ headerBackVisible: true }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Vous',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="provider"
        options={{
          title: 'Prestataire de services',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="editProfil"
        options={{
          title: 'Modifier son profil',
          headerBackVisible: true,
        }}
      />

      <Stack.Screen
        name="skills"
        options={{
          title: 'Vos compétences',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="profilPicture"
        options={{
          title: 'Photo de profil',
          headerBackVisible: false,
          headerLeft: () => (
            <Link asChild href="/(tabs)/settings">
              <Button variant={'ghost'} size={"iconSm"} className='me-4'>
                <ArrowLeft />
              </Button>
            </Link>
          ),
        }}
      />

      <Stack.Screen
        name="additionalSetting"
        options={{ title: 'Plus de paramètres', headerBackVisible: true }}
      />
    </Stack>
  );
}
export default SettingLayout;
