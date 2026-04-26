import { AccountStatusCard } from '@/components/store/account-status-card';
import { ProductCard } from '@/components/store/product-card';
import { SearchHeader } from '@/components/store/search-header';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useTRPC } from '@/provider/appProvider';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';

export default function StoreIndexScreen() {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(inputValue);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data, isLoading, refetch, isRefetching } = useQuery(
    trpc.store.listItems.queryOptions({ search, page, pageSize })
  );

  const { data: myItems } = useQuery({
    ...trpc.store.getMyItems.queryOptions(),
    enabled: !!session?.user?.id,
  });

  const { data: publishingStatus } = useQuery({
    ...trpc.store.getPublishingStatus.queryOptions(),
    enabled: !!session?.user?.id,
  });

  const hasProducts = (data?.length ?? 0) > 0;
  const hasNextPage = (data?.length ?? 0) >= pageSize;

  return (
    <ScrollView
      className="bg-background flex-1"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          colors={['orange']}
          tintColor="orange"
        />
      }
    >
      <View className="gap-6 px-1.5 py-6 pb-12">
        {/* Header Section */}
        <SearchHeader
          search={inputValue}
          onSearchChange={setInputValue}
          onRefresh={() => refetch()}
          isRefetching={isRefetching}
          session={session}
        />

        {isLoading ? (
          <View className="mt-10 w-full items-center justify-center">
            <ActivityIndicator size={64} color={'orange'} />
          </View>
        ) : (
          <>
            {/* Account Status Card */}
            {session && !inputValue ? (
              <AccountStatusCard
                myItemsCount={myItems?.length ?? 0}
                isPartner={publishingStatus?.isPartner ?? false}
                freeLimit={publishingStatus?.freeLimit ?? 2}
                freeWindowDays={publishingStatus?.freeWindowDays ?? 14}
                remainingFreePublications={publishingStatus?.remainingFreePublications ?? 0}
                partnerUntil={publishingStatus?.partnerUntil}
              />
            ) : null}

            {/* Products Grid */}
            {hasProducts ? (
              <View className="gap-3">
                <Text className="text-foreground text-sm font-semibold">
                  {data?.length} annonces trouvées
                </Text>

                <View className="flex-row flex-wrap justify-between gap-2">
                  {data?.map((item) => (
                    <ProductCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      price={item.price}
                      imageUrl={item.imageUrls?.[0]}
                      ownerName={item.owner.name}
                      ownerId={item.ownerId}
                      currentUserId={session?.user?.id}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View className="bg-secondary/20 gap-4 rounded-lg p-6">
                <Text className="text-foreground text-center text-lg font-semibold">
                  Aucune annonce disponible
                </Text>
                <Text className="text-muted-foreground text-center text-sm">
                  Essayez de modifier votre recherche ou revenez plus tard
                </Text>
              </View>
            )}

            {/* Pagination */}
            {hasProducts && (
              <View className="flex-row justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size={'iconSm'}
                  disabled={page <= 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-full">
                  <ArrowLeft />
                </Button>

                <Button
                  variant="outline"
                  size={'iconSm'}
                  disabled={!hasNextPage}
                  onPress={() => setPage((p) => p + 1)}
                  className="w-fit rounded-full px-1">
                  <Text>Plus</Text>
                  <ArrowRight />
                </Button>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
