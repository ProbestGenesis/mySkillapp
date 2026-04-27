import { ReelsFeed } from '@/components/reels/ReelsFeed';
import { Button } from '@/components/ui/button';
import { useTRPC } from '@/provider/appProvider';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function ReelsScreen() {
  const trpc = useTRPC();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery(
      trpc.reel.getReels.infiniteQueryOptions({
        limit: 10,
      }, {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      })
    );

  const reels = data?.pages.flatMap((page) => page.reels) ?? [];

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white text-lg">Erreur lors du chargement des reels</Text>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white text-lg">Aucun reel disponible</Text>
        <View className='flex-col items-center justify-center mt-2'>
          <Link href="/reels/upload"asChild>
          <Button size="lg" className='rounded-full'> <Text className='text-white'>Ajouter un reel</Text></Button>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ReelsFeed
        data={reels}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
      />
    </View>
  );
}
