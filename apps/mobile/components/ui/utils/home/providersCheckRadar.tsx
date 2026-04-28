import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { usePreciseLocation } from '@/lib/geolocation';
import { useTRPC } from '@/provider/appProvider';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Locate } from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, Text, TouchableOpacity, View } from 'react-native';
import Ripple from '../../radar';
import { Skeleton } from '../../skeleton';
import MyPostInfo from './myPostsInfo';
import { ProviderCard } from './providersCard';

/** Aligné sur `providers.listNear` (Provider + user + skills + distance). */
export type NearProviderRow = {
  id: string;
  profession: string;
  rate: number;
  mission_nb: number;
  bio: string | null;
  user: { name: string; image: string | null };
  skills: { id: string; title: string; description: string; average_price: number }[];
  distanceM: number;
  distance: number
};

type Props = {
  selectedService: string | null;
};

function ProviderCheckRadar({ selectedService }: Props) {
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

  const stableLoc = useMemo(() => {
    if (!location) return null;
    return {
      lat: location.latitude,
      long: location.longitude,
    };
  }, [location?.latitude, location?.longitude]);

  React.useEffect(() => {
    if (locationError || !stableLoc) {
      setLocationAlert(true);
      setLocationMessageError({
        title: 'Erreur de localisation',
        description:
          "Veuillez activer votre localisation et relancer l'application pour voir les prestataires à proximité",
        type: undefined,
      });
    }
  }, [locationError, stableLoc]);

  const nearQuery = useQuery({
    ...trpc.providers.listNear.queryOptions({
      latitude: stableLoc?.lat ?? 0,
      longitude: stableLoc?.long ?? 0,
      excludeUserId: session?.user?.id,
      service: selectedService ?? undefined,
    }),
    enabled: !!stableLoc,
  });

  const nearProviders: NearProviderRow[] = nearQuery.data ?? [];
  const loadingNearProviders = nearQuery.isFetching;

  {
    /*  const providerQuery = useQuery({
    ...trpc.providers.getProvider.queryOptions({ id: providerId }),
    enabled: viewProviderCard && !!providerId,
  });
*/
  }
  const { data: userPostsQuery, isPending: userPostFecthing } = useQuery({
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

  const userPosts = userPostsQuery ?? [];

  return (
    <View className="relative flex-1 flex-col items-center justify-center">
      <View
        className="relative m-2 h-[60vh] w-full flex-col items-center justify-center"
        onLayout={onLayout}>
        {' '}
        <Ripple />
        <View className="absolute top-[53%] left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 items-center">
          {session?.user.image ? (
            <Avatar
              alt="user-avatar"
              style={{ width: CENTRAL_AVATAR_SIZE, height: CENTRAL_AVATAR_SIZE }}>
              <AvatarImage source={{ uri: session?.user?.image ?? undefined }} />
              <AvatarFallback />
            </Avatar>
          ) : (
            <Link href={'/(tabs)/settings/profilPicture'}>
              <Avatar
                alt="user-avatar"
                style={{ width: CENTRAL_AVATAR_SIZE, height: CENTRAL_AVATAR_SIZE }}>
                <AvatarFallback>
                  <Text className="text-center">Ajouter une photo</Text>
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
          <Text className="mt-2 text-sm font-medium">{session?.user?.name ?? 'Vous'}</Text>
        </View>
        <AnimatePresence>
          {nearProviders.map((item, idx: number) => {
            const minDistance = nearProviders[0]?.distanceM ?? 0;
            const maxDistance = nearProviders[nearProviders.length - 1]?.distanceM ?? minDistance;
            const distanceRange = Math.max(maxDistance - minDistance, 1);
            const radiusRatio = Math.min(
              Math.max((item.distanceM - minDistance) / distanceRange, 0),
              1
            );
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
                    <View className="bg-muted flex-row gap-1.5 items-center rounded-full px-1.5 py-0.5">
                      <Locate size={8} className="text-muted-foreground mr-1" />
                      <Text className="text-muted-foreground text-[0.5rem]">
                        {item?.distance?.toFixed(2)} km
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </MotiView>
            );
          })}
        </AnimatePresence>
        <ProviderCard
          provider={nearProviders.filter((el) => el.id === providerId)[0]}
          viewProviderCard={viewProviderCard}
          onClose={onCloseProvieerCard}
          providerCardDataLoading={false}
        />
        <View className="absolute bottom-2 items-center">
          <View className="flex-col gap-1.5">
            {!stableLoc ? (
              <Text className="text-destructive text-center text-sm">
                Activez la localisation pour voir les prestataires à proximité.
              </Text>
            ) : (
              <>
                <Text className="mx-auto text-2xl font-bold tracking-tighter">
                  Près de chez vous
                </Text>
                {loadingNearProviders ? (
                  <Text className="text-muted-foreground mx-auto mt-2 text-center text-sm">
                    Recherche…
                  </Text>
                ) : (
                  <Text className="mx-auto mt-2 text-center text-sm">
                    {nearProviders.length} prestataires à proximité
                    {selectedService ? ` - ${selectedService}` : ''}
                  </Text>
                )}
              </>
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

      {userPostFecthing ? (
        <View className="absolute right-1 bottom-4 mx-auto">
          <View className="flex flex-col gap-2.5">
            <Skeleton className="h-6 w-12" />

            <View className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-12 w-12 rounded-full" />
              ))}
            </View>
          </View>
        </View>
      ) : (
        <>
          {' '}
          {userPosts && userPosts?.length > 0 && (
            <View className="absolute right-1 bottom-4 mx-auto">
              <View className="flex-col items-center gap-2">
                <Text>Vos posts</Text>
                {userPosts &&
                  userPosts?.map((item: any) => (
                    <MyPostInfo key={item.id} postId={item.id}>
                      <Avatar alt="posts" className="size-12">
                        <AvatarImage />
                        <AvatarFallback>
                          <Text className="text-xs">{item?.profession?.slice(0, 2)}</Text>
                        </AvatarFallback>
                      </Avatar>
                    </MyPostInfo>
                  ))}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

export default ProviderCheckRadar;
