import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { useTRPC } from '@/provider/appProvider'
import { useQuery } from '@tanstack/react-query'
import { Link, useRouter } from 'expo-router'
import React from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'

export default function StoreConversationsScreen() {
  const { data: session } = authClient.useSession()
  const trpc = useTRPC()
  const router = useRouter()

  const { data, isLoading, refetch, isRefetching } = useQuery({
    ...trpc.store.listMyConversations.queryOptions(),
    enabled: !!session?.user?.id,
  })

  if (!session) {
    router.replace('/auth')
    return null
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 px-4 py-3" refreshControl={undefined}>
      <View className="gap-3 pb-10">
        <Text className="text-xl font-bold">Mes discussions</Text>
        <Button variant="outline" onPress={() => refetch()} disabled={isRefetching}>
          <Text>Actualiser</Text>
        </Button>

        {data?.length ? (
          data.map((conversation) => {
            const other =
              conversation.ownerId === session.user.id ? conversation.customer : conversation.owner
            const lastMessage = conversation.messages[0]
            return (
              <Link key={conversation.id} href={`/(tabs)/store/messages/${conversation.id}`} asChild>
                <Card>
                  <CardContent className="gap-1 pt-4">
                    <Text className="font-semibold">{conversation.item.title}</Text>
                    <Text className="text-sm text-muted-foreground">Avec: {other.name}</Text>
                    <Text className="text-sm">{lastMessage?.content || 'Aucun message'}</Text>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        ) : (
          <Text className="text-muted-foreground">Aucune discussion pour le moment.</Text>
        )}
      </View>
    </ScrollView>
  )
}
