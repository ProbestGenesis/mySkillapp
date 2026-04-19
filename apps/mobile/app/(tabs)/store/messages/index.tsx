import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { useTRPC } from '@/provider/appProvider'
import { useQuery } from '@tanstack/react-query'
import { Link, useRouter } from 'expo-router'
import React from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import  { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
        {data?.length ? (
          data.map((conversation) => {
            const other =
              conversation.ownerId === session.user.id ? conversation.customer : conversation.owner
            const lastMessage = conversation.messages[0]
            return (
              <Link key={conversation.id} href={`/(tabs)/store/messages/${conversation.id}`}>
                <Card className='p-1.5 px-0 w-full'>
                  <CardContent className="gap-1 pt-0">
                    <View className='flex-row items-center gap-2'>
                      <Avatar alt={`${other.name} profil picture`} className="h-12 w-12">
                        <AvatarImage source={{ uri: conversation.item.imageUrls[0] ?? '' }} />
                        <AvatarFallback>{other.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <View className='flex-1'>
                        <Text className="font-semibold">{conversation.item.title}</Text>
                        <Text className="text-sm text-muted-foreground">{other.name}</Text>
                      </View>
                    </View>
                    <Text className="text-sm ml-16">{lastMessage?.content || 'Aucun message'}</Text>
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
