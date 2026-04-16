import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { usePreciseLocation } from '@/lib/geolocation';
import { useTRPC } from '@/provider/appProvider';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, MotiView } from 'moti';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, Text, TouchableOpacity, View } from 'react-native';
import DemandCard from './clients/demandCard';

/** Aligné sur `customers.listNearDemands` (Post + user + distance). */
type NearDemandPost = {
  id: string;
  user: { id: string; name: string; image: string | null };
};

type Props = Record<string, never>;

function CustomerCheckRadar(_props: Props) {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { location } = usePreciseLocation();

  const [showClientDemandeCard, setShowClientDemandCard] = useState(false);
  const [clientIds, setClientIds] = useState({ demandId: '', id: '' });

  const stableLoc = useMemo(() => {
    if (!location) return null;
    return {
      lat: parseFloat(location.latitude.toFixed(4)),
      long: parseFloat(location.longitude.toFixed(4)),
    };
  }, [location?.latitude, location?.longitude]);

  const nearQuery = useQuery({
    ...trpc.customers.listNearDemands.queryOptions({
      latitude: stableLoc?.lat ?? 0,
      longitude: stableLoc?.long ?? 0,
      excludeUserId: session?.user?.id,
    }),
    enabled: !!stableLoc,
  });

  const nearsCustomers: NearDemandPost[] = nearQuery.data ?? [];
  const loadingNearCustomers = nearQuery.isFetching;

  const onLayout = useCallback((_e: LayoutChangeEvent) => {}, []);

  const onClose = () => {
    setShowClientDemandCard(false);
  };

  const refetchNearby = () => {
    void nearQuery.refetch();
  };

  const AVATAR_SIZE = 64;
  const CENTRAL_AVATAR_SIZE = 96;
  const MIN_RADIUS = CENTRAL_AVATAR_SIZE / 2 + AVATAR_SIZE / 2 + 20;
  const MAX_RADIUS = 160;

  return (
    <View className="relative flex-1 flex-col items-center justify-center">
      <View
        className="relative h-[60vh] w-full flex-col items-center justify-center"
        onLayout={onLayout}>
        <View className="absolute top-[47%] left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 items-center">
          <View className="absolute top-[47%] left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 items-center">
            <Avatar
              alt="user-avatar"
              style={{ width: CENTRAL_AVATAR_SIZE, height: CENTRAL_AVATAR_SIZE }}>
              <AvatarImage source={{ uri: session?.user?.image ?? undefined }} />
              <AvatarFallback />
            </Avatar>
            <Text className="mt-2 text-sm font-medium">{session?.user?.name ?? 'Vous'}</Text>
          </View>

          <AnimatePresence>
            {nearsCustomers.map((item, idx: number) => {
              const total = nearsCustomers.length > 1 ? nearsCustomers.length - 1 : 1;
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
                    activeOpacity={0.8}
                    onPress={() => {
                      setShowClientDemandCard(true);
                      setClientIds({ demandId: item.id, id: item.user.id });
                    }}>
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
                      <View className="absolute -bottom-5 rounded-full bg-white/90 px-2 py-0.5 shadow-sm">
                        <Text
                          className="max-w-[80px] text-center text-[10px] font-bold text-black"
                          numberOfLines={1}>
                          {item.user.name}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </AnimatePresence>
        </View>

        {showClientDemandeCard && (
          <DemandCard
            onClose={onClose}
            showDemandCard={showClientDemandeCard}
            clientIds={clientIds}
          />
        )}

        <View className="absolute bottom-2 items-center">
          <View className="flex-col gap-1.5">
            {!stableLoc ? (
              <Text className="text-muted-foreground text-center text-sm">
                Activez la localisation pour voir les clients à proximité.
              </Text>
            ) : null}

            {session ? (
              <>
                <Text className="mx-auto text-2xl font-bold tracking-tighter">Près de chez vous</Text>
                {loadingNearCustomers ? (
                  <Text className="text-muted-foreground mt-2 text-sm text-center mx-auto">Recherche…</Text>
                ) : (
                  <Text className="mt-2 text-sm text-center mx-auto">
                    {nearsCustomers.length} client(s) à proximité
                  </Text>
                )}
              </>
            ) : (
              <Text className="text-destructive text-center mx-auto">Vous devez avoir un compte</Text>
            )}

            {!session ? (
              <Button
                className="relative rounded-full"
                variant="outline"
                size="sm"
                onPress={() => {
                  router.push({ pathname: '/auth', params: { role: 'provider' } });
                }}>
                <Text>Se connecter</Text>
              </Button>
            ) : (
              <Button
                className="relative rounded-full"
                variant="outline"
                size="sm"
                onPress={refetchNearby}
                disabled={!stableLoc}>
                <Text>Actualiser</Text>
              </Button>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

export default CustomerCheckRadar;
