import { Stack } from "expo-router"

type Props = {}
function SettingLayout({}: Props) {
  return (
      <Stack screenOptions={{  }} >
      <Stack.Screen
        name="index"
        options={{
          title: 'Vous',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="provider"
        options={{
          title: 'Prestataire de services',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen  name="editProfil" options={{
        title: "Modifier son profil",
        headerBackVisible: true
      }} />

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
          headerBackVisible: true,
        }}
      />
    </Stack>
  )
}
export default SettingLayout