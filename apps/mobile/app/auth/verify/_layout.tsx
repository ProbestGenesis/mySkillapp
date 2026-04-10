import { Stack } from "expo-router"

type Props = {}
function VerifyLayout({}: Props) {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="phoneNumber" options={{presentation: "fullScreenModal"}} />
    </Stack>
  )
} 
export default VerifyLayout