import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { usePreciseLocation } from '@/lib/geolocation';
import { useTRPC } from '@/provider/appProvider';
import { useQuery } from '@tanstack/react-query';
import { AlertCircleIcon } from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, Text, TouchableOpacity, View } from 'react-native';
import { ProviderCard } from './providersCard';
import AddPostBtn from './addPostBtn';
import Ripple from '../../radar';
import MyPostInfo from './myPostsInfo';

/** Aligné sur `providers.listNear` (Provider + user + skills + distance). */
type NearProviderRow = {
  id: string;
  profession: string;
  user: { name: string; image: string | null };
};

type Props = Record<string, never>;

function ProviderCheckRadar(_props: Props) {
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const { location, error: locationError } = usePreciseLocation();

  const [providerId, setProviderId] = useState('');
  const [viewProviderCard, setViewProviderCard] = useState(false);
  const [locationAlert, setLocationAlert] = useState(false);
  const [locationMessageError, setLocationMessageError] = useState({
    title: '',
    description: '',
    type: undefined as 'LocationPermissionDenied' | undefined,
  });

  const onCloseProvieerCard = () => {
    setViewProviderCard(false);
  };

  React.useEffect(() => {
    if (locationError) {
      setLocationAlert(true);
      setLocationMessageError({
        title: 'Erreur de localisation',
        description: locationError,
        type: undefined,
      });
    }
  }, [locationError]);

  const stableLoc = useMemo(() => {
    if (!location) return null;
    return {
      lat: parseFloat(location.latitude.toFixed(4)),
      long: parseFloat(location.longitude.toFixed(4)),
    };
  }, [location?.latitude, location?.longitude]);

  const nearQuery = useQuery({
    ...trpc.providers.listNear.queryOptions({
      latitude: stableLoc?.lat ?? 0,
      longitude: stableLoc?.long ?? 0,
      excludeUserId: session?.user?.id,
    }),
    enabled: !!stableLoc,
  });
  const nearProviders: NearProviderRow[] = nearQuery.data ?? [];
  const loadingNearProviders = nearQuery.isFetching;

  const providerQuery = useQuery({
    ...trpc.providers.getProvider.queryOptions({ id: providerId }),
    enabled: viewProviderCard && !!providerId,
  });

  const userPostsQuery = useQuery({
    ...trpc.post.listMyPosts.queryOptions(),
    enabled: !!session,
  });

  const AVATAR_SIZE = 64;
  const CENTRAL_AVATAR_SIZE = 96;
  const MIN_RADIUS = CENTRAL_AVATAR_SIZE / 2 + AVATAR_SIZE / 2 + 15;
  const MAX_RADIUS = 160;

  const onLayout = useCallback((_e: LayoutChangeEvent) => {}, []);

  const refetchNearby = () => {
    void nearQuery.refetch();
  };

  const userPosts = userPostsQuery.data ?? [];

  return (
    <View className="relative flex-1 flex-col items-center justify-center">
      <View
        className="relative m-2 h-[60vh] w-full flex-col items-center justify-center"
        onLayout={onLayout}>  <Ripple  />
        <View className="absolute top-[53%] left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 items-center">
       
          <Avatar
            alt="user-avatar"
            style={{ width: CENTRAL_AVATAR_SIZE, height: CENTRAL_AVATAR_SIZE }}>
            <AvatarImage source={{ uri: session?.user?.image ?? undefined }} />
            <AvatarFallback />
          </Avatar>
          <Text className="mt-2 text-sm font-medium">{session?.user?.name ?? 'Vous'}</Text>
        </View>

        <AnimatePresence>
          {nearProviders.map((item, idx: number) => {
            const total = nearProviders.length > 1 ? nearProviders.length - 1 : 1;
            const radiusRatio = idx / total;
            const currentRadius = MIN_RADIUS + radiusRatio * (MAX_RADIUS - MIN_RADIUS);
            const goldenAngle = 137.5 * (Math.PI / 180);
            const angleRad = idx * goldenAngle;
            const x = Math.cos(angleRad) * currentRadius;
            const y = Math.sin(angleRad) * currentRadius;

            return (
              <MotiView
                key={item.id}
                from={{ opacity: 0, scale: 0, translateX: 0, translateY: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  translateX: x - AVATAR_SIZE / 2,
                  translateY: y - AVATAR_SIZE / 2,
                }}
                transition={{
                  type: 'spring',
                  damping: 15,
                  stiffness: 100,
                  delay: idx * 100,
                }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '47%',
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  zIndex: 30 - idx,
                }}>
                <TouchableOpacity
                  onPress={() => {
                    setProviderId(item.id);
                    setViewProviderCard(true);
                  }}
                  activeOpacity={0.8}>
                  <View className="flex-col items-center justify-center gap-0.5">
                    <Avatar
                      alt={`avatar-${idx}`}
                      style={{
                        width: AVATAR_SIZE,
                        height: AVATAR_SIZE,
                        borderWidth: 2,
                        borderColor: 'white',
                      }}>
                      <AvatarImage source={{ uri: item.user?.image ?? undefined }} />
                      <AvatarFallback />
                    </Avatar>
                    <View className="absolute -bottom-5 rounded-full bg-white/80 px-2 py-0.5">
                      <Text
                        className="max-w-20 text-center text-[10px] font-bold text-black"
                        numberOfLines={1}>
                        {item.profession}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </MotiView>
            );
          })}
        </AnimatePresence>

        <ProviderCard
          provider={providerQuery.data}
          viewProviderCard={viewProviderCard}
          onClose={onCloseProvieerCard}
          providerCardDataLoading={providerQuery.isPending}
        />

        <View className="absolute bottom-2 items-center">
          <View className="flex-col gap-1.5">
            {!stableLoc ? (
              <Text className="text-muted-foreground text-center text-sm">
                Activez la localisation pour voir les prestataires à proximité.
              </Text>
            ) : null}
            <Text className="mx-auto text-2xl font-bold tracking-tighter">Près de chez vous</Text>
            {loadingNearProviders ? (
              <Text className="text-muted-foreground mt-2 text-sm text-center mx-auto">Recherche…</Text>
            ) : (
              <Text className="mt-2 text-sm text-center mx-auto">{nearProviders.length} prestataires à proximité</Text>
            )}

            <Button
              className="relative rounded-full"
              variant="outline"
              size="sm"
              onPress={refetchNearby}
              disabled={!stableLoc}>
              <Text>Actualiser</Text>
            </Button>
          </View>
        </View>
      </View>

      {locationAlert && (
        <View className="border-destructive/30 bg-destructive/10 mx-2 mt-2 rounded-xl border p-3">
          <View className="flex-row items-start gap-2">
            <AlertCircleIcon size={20} color="#ef4444" />
            <View className="flex-1">
              <Text className="text-destructive font-semibold">{locationMessageError.title}</Text>
              <Text className="text-muted-foreground mt-1 text-sm">
                {locationMessageError.description}
              </Text>
            </View>
          </View>
        </View>
      )}

      {userPosts && userPosts?.length > 0 && (
        <View className="absolute bottom-4 right-1 mx-auto">
          <View className="flex-col items-center gap-2">
            <Text>Vos posts</Text>
            {userPosts && userPosts?.map((item: any) => (
              <MyPostInfo key={item.id} postId={item.id} >
                <Avatar alt="posts" className="size-12">
                  <AvatarFallback>
                    <Text className="text-xs">{item?.title?.slice(0, 2)}</Text>
                  </AvatarFallback>
                </Avatar>
              </MyPostInfo>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default ProviderCheckRadar;
