import { Stack } from "expo-router"

type Props = {}
function TabsLayout({}: Props) {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(register)" />
      <Stack.Screen name="verify" />
    </Stack>
  )
} 
export default TabsLayout