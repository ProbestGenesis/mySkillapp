import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { useTRPC } from '@/provider/appProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, ImagePlus, Send, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StoreConversationDetailScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { data: session, isPending } = authClient.useSession();
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [wsConnected, setWsConnected] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImageIndex, setViewerImageIndex] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);

  const wsUrl = useMemo(() => {
    if (!session?.user?.id) return null;
    return `ws://api-production-d535.up.railway.app/ws/store?userId=${encodeURIComponent(session.user.id)}&conversations=${encodeURIComponent(conversationId)}`;
  }, [session?.user?.id, conversationId]);

  const { data, isLoading } = useQuery({
    ...trpc.store.getConversation.queryOptions({ conversationId, page, pageSize }),
    enabled: !!conversationId && !!session?.user?.id,
  });

  const { data: presenceData, refetch: refetchPresence } = useQuery({
    ...trpc.store.getConversationPresence.queryOptions({ conversationId }),
    enabled: !!conversationId && !!session?.user?.id,
  });

  const conversationImages = useMemo(() => {
    if (!data) return [];
    return data.messages.filter((m) => !!m.imageUrl).map((m) => m.imageUrl as string);
  }, [data]);
  const insets = useSafeAreaInsets();

  const uploadImageMutation = useMutation(trpc.store.uploadStoreItemImage.mutationOptions());

  const sendMutation = useMutation(
    trpc.store.sendMessage.mutationOptions({
      onSuccess: () => {
        setContent('');
        setSelectedImage(null);
        queryClient.invalidateQueries({
          queryKey: trpc.store.getConversation.queryKey({ conversationId, page, pageSize }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.store.listMyConversations.queryKey(),
        });
      },
    })
  );

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alert("L'accès à la galerie est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.55,
      base64: true,
    });
    if (result.canceled || !result.assets.length) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      if (asset.base64) {
        const { imageUrl } = await uploadImageMutation.mutateAsync({
          base64: asset.base64,
          mimeType: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || 'store.jpg',
        });
        setSelectedImage(imageUrl);
      }
    } catch (e: any) {
      alert('Échec upload image');
    } finally {
      setUploading(false);
    }
  };

  const onSend = () => {
    if (!content.trim() && !selectedImage) return;
    sendMutation.mutate({
      conversationId,
      content: content.trim(),
      imageUrl: selectedImage || undefined,
    });
  };

  const markReadMutation = useMutation(trpc.store.markConversationRead.mutationOptions());

  useEffect(() => {
    if (!data || !session?.user?.id) return;
    const hasUnreadFromOther = data.messages.some(
      (message) => message.senderId !== session.user.id && !message.readAt
    );
    if (hasUnreadFromOther) {
      markReadMutation.mutate({ conversationId });
    }
  }, [data, session?.user?.id, conversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (data?.messages) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [data?.messages]);

  useEffect(() => {
    if (!wsUrl) return;
    const socket = new WebSocket(wsUrl);
    socket.onopen = () => {
      setWsConnected(true);
      socket.send(JSON.stringify({ type: 'subscribe', conversationId }));
    };
    socket.onerror = () => {
      setWsConnected(false);
    };
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          conversationId?: string;
        };
        if (
          (payload.type === 'message_created' ||
            payload.type === 'message_read' ||
            payload.type === 'presence_changed') &&
          payload.conversationId === conversationId
        ) {
          queryClient.invalidateQueries({
            queryKey: trpc.store.getConversation.queryKey({ conversationId, page, pageSize }),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.store.listMyConversations.queryKey(),
          });
          refetchPresence();
        }
      } catch {
        // Ignore malformed ws payload
      }
    };
    socket.onclose = () => {
      setWsConnected(false);
    };
    return () => {
      setWsConnected(false);
      socket.close();
    };
  }, [wsUrl, conversationId, queryClient, trpc, page, pageSize, refetchPresence]);

  useEffect(() => {
    if (wsConnected) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: trpc.store.getConversation.queryKey({ conversationId, page, pageSize }),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.store.listMyConversations.queryKey(),
      });
      refetchPresence();
    }, 4000);
    return () => clearInterval(interval);
  }, [wsConnected, queryClient, trpc, conversationId, page, pageSize, refetchPresence]);

  if (!isPending && !session) {
    return (
      <SafeAreaView className="h-screen flex-1">
        <View className="h-full w-full flex-col items-center justify-center gap-2">
          <Text className="text-accent text-center text-lg">
            {' '}
            Vous devez vous connecter pour acceder a cette page{' '}
          </Text>
          <Button
            className="rounded-full"
            variant={'outline'}
            size={'lg'}
            onPress={() => {
              router.push('/auth');
            }}>
            {' '}
            <Text>Se connecter</Text>{' '}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="h-full flex-1">
        <View className="h-full w-full flex-row items-center justify-center">
          <ActivityIndicator size={64} color={'orange'} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView className="h-full flex-1">
        <View className="flex-1 items-center justify-center">
          <Text>Discussion introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 100}
      style={{ flex: 1 }}>
      {/* Header */}
      <View className="px-3 pt-2 pb-1">
        <Text className="text-lg font-bold">{data.item.title}</Text>
        <Text className="text-muted-foreground text-xs">
          {presenceData?.isOtherUserOnline ? 'En ligne' : 'Hors ligne'}
        </Text>
      </View>

      {/* Messages – flex-1 so it takes all available space */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-3"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}>
        <View className="gap-2 pb-4 pt-2">
          {data.messages.map((message) => {
            const mine = message.senderId === session?.user?.id;
            const readLabel = mine ? (message.readAt ? 'Vu' : 'Envoye') : '';
            return (
              <View
                key={message.id}
                className={`max-w-[85%] rounded-xl px-3 py-2 ${mine ? 'bg-primary self-end' : 'bg-muted self-start'}`}>
                {message.imageUrl && (
                  <Pressable
                    onPress={() => {
                      const idx = conversationImages.indexOf(message.imageUrl as string);
                      setViewerImageIndex(idx !== -1 ? idx : 0);
                      setViewerVisible(true);
                    }}>
                    <Image
                      source={{ uri: message.imageUrl }}
                      style={{
                        width: 200,
                        height: 200,
                        borderRadius: 8,
                        marginBottom: !!message.content ? 8 : 0,
                      }}
                      contentFit="cover"
                    />
                  </Pressable>
                )}
                {!!message.content && (
                  <Text className={mine ? 'text-white' : 'text-foreground'}>
                    {message.content}
                  </Text>
                )}
                <Text
                  className={`mt-1 text-[10px] ${mine ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {message.sender.name} {readLabel ? `- ${readLabel}` : ''}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Input bar – fixed at bottom */}
      <View className="border-border border-t px-3 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
        {selectedImage && (
          <View className="bg-muted relative mb-2 self-start rounded-lg p-2">
            <Image
              source={{ uri: selectedImage }}
              style={{ width: 100, height: 100, borderRadius: 8 }}
            />
            <Pressable
              onPress={() => setSelectedImage(null)}
              className="bg-destructive absolute -top-2 -right-2 rounded-full p-1">
              <X size={16} color="white" />
            </Pressable>
          </View>
        )}

        <View className="flex-row items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onPress={pickImage}
            disabled={uploading}
            className="rounded-full">
            {uploading ? (
              <ActivityIndicator size="small" color="black" />
            ) : (
              <ImagePlus size={20} color="black" />
            )}
          </Button>
          <Input
            className="flex-1"
            placeholder="Votre message"
            value={content}
            onChangeText={setContent}
          />
          <Button
            onPress={onSend}
            disabled={
              sendMutation.isPending || uploading || (!content.trim() && !selectedImage)
            }
            size={"sm"}
            className="rounded-full">
            {
              sendMutation.isPending ? <ActivityIndicator color="white" /> :  <Send color="white" />
            }
          </Button>
        </View>
      </View>

      <Modal visible={viewerVisible} transparent={true} animationType="fade">
        <View className="relative flex-1 items-center justify-center bg-black/95">
          <SafeAreaView className="absolute top-0 z-10 w-full flex-row justify-end p-4">
            <Pressable
              onPress={() => setViewerVisible(false)}
              className="mt-2 mr-2 rounded-full bg-white/20 p-2">
              <X size={24} color="white" />
            </Pressable>
          </SafeAreaView>

          {conversationImages.length > 0 && (
            <Image
              source={{ uri: conversationImages[viewerImageIndex] }}
              style={{ width: '100%', height: '80%' }}
              contentFit="contain"
            />
          )}

          <View className="absolute bottom-10 w-full flex-row justify-between px-10">
            <Pressable
              onPress={() => setViewerImageIndex((prev) => Math.max(0, prev - 1))}
              disabled={viewerImageIndex === 0}
              className={`rounded-full p-3 ${viewerImageIndex === 0 ? 'bg-white/10' : 'bg-white/30'}`}>
              <ChevronLeft
                size={32}
                color={viewerImageIndex === 0 ? 'rgba(255,255,255,0.3)' : 'white'}
              />
            </Pressable>
            <Pressable
              onPress={() =>
                setViewerImageIndex((prev) => Math.min(conversationImages.length - 1, prev + 1))
              }
              disabled={viewerImageIndex === conversationImages.length - 1}
              className={`rounded-full p-3 ${viewerImageIndex === conversationImages.length - 1 ? 'bg-white/10' : 'bg-white/30'}`}>
              <ChevronRight
                size={32}
                color={
                  viewerImageIndex === conversationImages.length - 1
                    ? 'rgba(255,255,255,0.3)'
                    : 'white'
                }
              />
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
