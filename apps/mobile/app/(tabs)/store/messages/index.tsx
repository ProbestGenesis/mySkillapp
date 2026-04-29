import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { authClient } from '@/lib/auth-client';
import { useTRPC } from '@/provider/appProvider';
import { useQuery } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from "@/components/ui/button"

export default function StoreConversationsScreen() {
  const { data: session, isPending } = authClient.useSession();
  const trpc = useTRPC();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    ...trpc.store.listMyConversations.queryOptions(),
    enabled: !!session?.user?.id,
  });

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
            size={"lg"}
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

  return (
    <ScrollView
      className="flex-1 px-4 py-3"
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          colors={['orange']}
          tintColor="orange"
        />
      }
    >
      <View className="gap-3 pb-10">
        {data?.length ? (
          data.map((conversation) => {
            const other =
              conversation.ownerId === session?.user.id ? conversation.customer : conversation.owner;
            const lastMessage = conversation.messages[0];
            return (
              <Link key={conversation.id} href={`/(tabs)/store/messages/${conversation.id}`}>
                <Card className="w-full p-1.5 px-0">
                  <CardContent className="gap-1 pt-0">
                    <View className="flex-row items-center gap-2">
                      <Avatar alt={`${other.name} profil picture`} className="h-12 w-12">
                        <AvatarImage source={{ uri: conversation.item.imageUrls[0] ?? '' }} />
                        <AvatarFallback>{other.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <View className="flex-1">
                        <Text className="font-semibold">{conversation.item.title}</Text>
                        <Text className="text-muted-foreground text-sm">{other.name}</Text>
                      </View>
                    </View>
                    <Text className="ml-16 text-sm">{lastMessage?.content || 'Aucun message'}</Text>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        ) : (
          <Text className="text-muted-foreground">Aucune discussion pour le moment.</Text>
        )}
      </View>
    </ScrollView>
  );
}
