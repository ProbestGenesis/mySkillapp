import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'
import { useTRPC } from '@/provider/appProvider'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'

export default function StoreConversationDetailScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>()
  const { data: session } = authClient.useSession()
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')

  const { data, isLoading } = useQuery({
    ...trpc.store.getConversation.queryOptions({ conversationId }),
    enabled: !!conversationId && !!session?.user?.id,
  })

  const sendMutation = useMutation(
    trpc.store.sendMessage.mutationOptions({
      onSuccess: () => {
        setContent('')
        queryClient.invalidateQueries({
          queryKey: trpc.store.getConversation.queryKey({ conversationId }),
        })
        queryClient.invalidateQueries({
          queryKey: trpc.store.listMyConversations.queryKey(),
        })
      },
    })
  )

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

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Discussion introuvable</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 px-3 py-2">
      <Text className="text-lg font-bold">{data.item.title}</Text>
      <ScrollView className="mt-3 flex-1">
        <View className="gap-2 pb-4">
          {data.messages.map((message) => {
            const mine = message.senderId === session.user.id
            return (
              <View
                key={message.id}
                className={`max-w-[85%] rounded-xl px-3 py-2 ${mine ? 'self-end bg-primary' : 'self-start bg-muted'}`}>
                <Text className={mine ? 'text-white' : 'text-foreground'}>{message.content}</Text>
                <Text className={`mt-1 text-[10px] ${mine ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {message.sender.name}
                </Text>
              </View>
            )
          })}
        </View>
      </ScrollView>

      <View className="flex-row items-center gap-2 pb-3">
        <Input
          className="flex-1"
          placeholder="Votre message"
          value={content}
          onChangeText={setContent}
        />
        <Button
          onPress={() => sendMutation.mutate({ conversationId, content })}
          disabled={sendMutation.isPending || !content.trim()}>
          <Text className="font-bold text-white">Envoyer</Text>
        </Button>
      </View>
    </View>
  )
}
