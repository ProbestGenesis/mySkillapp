import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'
import { useTRPC } from '@/provider/appProvider'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'

export default function StoreConversationDetailScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>()
  const { data: session } = authClient.useSession()
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25
  const [wsConnected, setWsConnected] = useState(false)

  const wsUrl = useMemo(() => {
    if (!session?.user?.id) return null
    return `ws://192.168.201.16:4000/ws/store?userId=${encodeURIComponent(session.user.id)}&conversations=${encodeURIComponent(conversationId)}`
  }, [session?.user?.id, conversationId])

  const { data, isLoading } = useQuery({
    ...trpc.store.getConversation.queryOptions({ conversationId, page, pageSize }),
    enabled: !!conversationId && !!session?.user?.id,
  })

  const { data: presenceData, refetch: refetchPresence } = useQuery({
    ...trpc.store.getConversationPresence.queryOptions({ conversationId }),
    enabled: !!conversationId && !!session?.user?.id,
  })

  const sendMutation = useMutation(
    trpc.store.sendMessage.mutationOptions({
      onSuccess: () => {
        setContent('')
        queryClient.invalidateQueries({
          queryKey: trpc.store.getConversation.queryKey({ conversationId, page, pageSize }),
        })
        queryClient.invalidateQueries({
          queryKey: trpc.store.listMyConversations.queryKey(),
        })
      },
    })
  )

  const markReadMutation = useMutation(trpc.store.markConversationRead.mutationOptions())

  useEffect(() => {
    if (!data || !session?.user?.id) return
    const hasUnreadFromOther = data.messages.some(
      (message) => message.senderId !== session.user.id && !message.readAt
    )
    if (hasUnreadFromOther) {
      markReadMutation.mutate({ conversationId })
    }
  }, [data, session?.user?.id, conversationId])

  useEffect(() => {
    if (!wsUrl) return
    const socket = new WebSocket(wsUrl)
    socket.onopen = () => {
      setWsConnected(true)
      socket.send(JSON.stringify({ type: 'subscribe', conversationId }))
    }
    socket.onerror = () => {
      setWsConnected(false)
    }
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string
          conversationId?: string
        }
        if (
          (payload.type === 'message_created' ||
            payload.type === 'message_read' ||
            payload.type === 'presence_changed') &&
          payload.conversationId === conversationId
        ) {
          queryClient.invalidateQueries({
            queryKey: trpc.store.getConversation.queryKey({ conversationId, page, pageSize }),
          })
          queryClient.invalidateQueries({
            queryKey: trpc.store.listMyConversations.queryKey(),
          })
          refetchPresence()
        }
      } catch {
        // Ignore malformed ws payload
      }
    }
    socket.onclose = () => {
      setWsConnected(false)
    }
    return () => {
      setWsConnected(false)
      socket.close()
    }
  }, [wsUrl, conversationId, queryClient, trpc, page, pageSize, refetchPresence])

  useEffect(() => {
    if (wsConnected) return
    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: trpc.store.getConversation.queryKey({ conversationId, page, pageSize }),
      })
      queryClient.invalidateQueries({
        queryKey: trpc.store.listMyConversations.queryKey(),
      })
      refetchPresence()
    }, 4000)
    return () => clearInterval(interval)
  }, [wsConnected, queryClient, trpc, conversationId, page, pageSize, refetchPresence])

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
      <Text className="text-xs text-muted-foreground">
        {presenceData?.isOtherUserOnline ? 'En ligne' : 'Hors ligne'} {wsConnected ? '- temps reel' : '- mode polling'}
      </Text>
      <ScrollView className="mt-3 flex-1">
        <View className="gap-2 pb-4">
          {data.messages.map((message) => {
            const mine = message.senderId === session.user.id
            const readLabel = mine ? (message.readAt ? 'Vu' : 'Envoye') : ''
            return (
              <View
                key={message.id}
                className={`max-w-[85%] rounded-xl px-3 py-2 ${mine ? 'self-end bg-primary' : 'self-start bg-muted'}`}>
                <Text className={mine ? 'text-white' : 'text-foreground'}>{message.content}</Text>
                <Text className={`mt-1 text-[10px] ${mine ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {message.sender.name} {readLabel ? `- ${readLabel}` : ''}
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
          onPress={() => sendMutation.mutate({ conversationId, content: content.trim() })}
          disabled={sendMutation.isPending || !content.trim()}>
          <Text className="font-bold text-white">Envoyer</Text>
        </Button>
      </View>
    </View>
  )
}
