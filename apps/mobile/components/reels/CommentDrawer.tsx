import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useTRPC } from '@/provider/appProvider';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, MotiView } from 'moti';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CommentDrawerProps {
  visible: boolean;
  reelId: string;
  onClose: () => void;
  commentCount: number;
}

export const CommentDrawer = ({ visible, reelId, onClose, commentCount }: CommentDrawerProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [commentText, setCommentText] = useState('');
  const [currentCommentCount, setCurrentCommentCount] = useState(commentCount)

  const {
    data: comments,
    isLoading,
    refetch,
  } = useQuery({
    ...trpc.reel.getComments.queryOptions({ reelId }),
    enabled: visible,
  });

  const addCommentMutation = useMutation({
    ...trpc.reel.addComment.mutationOptions(),
    onSuccess: () => {
      setCommentText('');
      setCurrentCommentCount(prv => prv + 1)
      refetch();
      Keyboard.dismiss();
    },
  });

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ reelId, comment: commentText });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      className="flex-1">
      <AnimatePresence>
        {visible && (
          <View className="absolute inset-0 z-50 justify-end">
            {/* Backdrop */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 200 }}
              className="absolute inset-0 bg-black/40">
              <Pressable className="h-full w-full" onPress={onClose} />
            </MotiView>

            {/* Drawer Content */}
            <MotiView
              from={{ translateY: 600 }}
              animate={{ translateY: 0 }}
              exit={{ translateY: 600 }}
              transition={{ type: 'spring', stiffness: 150 }}
              className="h-[75%] w-full overflow-hidden rounded-t-[32px] bg-white pt-2">
              {/* Header Handle */}
              <Pressable className="items-center py-2" onPress={() => onClose()} >
                <View className="h-1.5 w-12 rounded-full bg-gray-200" />
              </Pressable>

              {/* Title */}
              <View className="flex-row items-center justify-center border-b border-gray-100 px-4 pb-4">
                <Text className="text-[15px] font-bold text-gray-900">
                  {currentCommentCount} commentaires
                </Text>
              <Pressable onPress={onClose} className="absolute right-4">
                  <Ionicons name="close" size={24} color="gray" />
                </Pressable>
              </View>

              {/* Comments List */}
              <View className="flex-1">
                {isLoading ? (
                  <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#000" />
                  </View>
                ) : (
                  <FlashList
                    data={comments}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    scrollEnabled
                    renderItem={({ item }) => (
                      <View className="mb-6 flex-row items-start">
                        <Avatar className="h-9 w-9" alt={`${item.user.name} profil picture`}>
                          <AvatarImage source={{ uri: item.user.image || '' }} />
                          <AvatarFallback>
                            <Text className="text-xs">
                              {item.user.name.substring(0, 2).toUpperCase()}
                            </Text>
                          </AvatarFallback>
                        </Avatar>
                        <View className="ml-3 flex-1">
                          <View className="mb-0.5 flex-col">
                            <Text className="mr-2 text-[13px] font-bold text-gray-900">
                              {item.user.name}
                            </Text>
                            <Text className="text-[11px] text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </View>
                          <Text className="text-[14px] leading-5 text-gray-800">
                            {item.comment}
                          </Text>
                        </View>
                      </View>
                    )}
                    ListEmptyComponent={
                      <View className="items-center justify-center py-20">
                        <Ionicons name="chatbubble-outline" size={48} color="#E5E7EB" />
                        <Text className="mt-4 text-gray-400">Aucun commentaire pour le moment</Text>
                      </View>
                    }
                  />
                )}
              </View>

              {/* Input Area */}

              <View
                className="flex-row items-center gap-3 border-t border-gray-100 bg-white px-4 py-3"
                style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
                <View className="flex-1 flex-row items-center   gap-4  ps-4 pe-2 py-1">
                  <Input
                    placeholder="Ajouter un commentaire..."
                    className="h-10 flex-1 border-0 bg-transparent text-[14px] rounded-full"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                  />
                  {commentText.trim().length > 0 && (
                    <Pressable onPress={handleSendComment} disabled={addCommentMutation.isPending}>
                      {addCommentMutation.isPending ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <Ionicons name="arrow-up-circle" size={32} color="#000" />
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
            </MotiView>
          </View>
        )}
      </AnimatePresence>
    </KeyboardAvoidingView>
  );
};
