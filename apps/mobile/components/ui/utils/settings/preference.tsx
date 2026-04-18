import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Settings } from "lucide-react-native"
import { Text, View } from "react-native"

export function Preference() {
    return (
        <Card>
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <Settings />
                  <Text className="text-lg font-bold">Preference</Text>
                </View>
              </CardHeader>

              <CardContent className="flex-col gap-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-col gap-1">
                    <Text className="text-lg">Activer les notifications</Text>
                    <Text className="text-muted">
                      Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ipsa, magnam
                      laboriosam
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-col gap-1">
                    <Text className="text-lg">Email marketing</Text>
                    <Text className="text-muted">
                      Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ipsa, magnam
                      laboriosam
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
    )
}