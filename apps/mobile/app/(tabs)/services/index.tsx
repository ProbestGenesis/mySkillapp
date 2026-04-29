import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useSession } from '@/lib/auth-client';
import { usePreciseLocation } from '@/lib/geolocation';
import { secretCode } from '@/lib/zodSchema';
import { useTRPC } from '@/provider/appProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  CalendarClock,
  Check,
  Locate,
  QrCode,
  Star,
  UserIcon,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type DialogType = 'CARE' | 'CANCEL' | 'FINISH' | 'RATE' | 'APPOINTMENT' | null;

const RatingStars = ({
  rating,
  onRatingChange,
}: {
  rating: number;
  onRatingChange: (r: number) => void;
}) => {
  return (
    <View className="flex-row justify-center gap-2 py-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onRatingChange(star)}>
          <Star
            size={32}
            fill={star <= rating ? '#EAB308' : 'transparent'}
            color={star <= rating ? '#EAB308' : '#A3A3A3'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'En attente', color: 'text-destructive', bg: 'bg-destructive/10' };
      case 'ACCEPTED':
        return { label: 'Accepté', color: 'text-primary', bg: 'bg-primary/10' };
      case 'IN_PROGRESS':
        return { label: 'En cours', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'COMPLETED':
        return { label: 'Terminé', color: 'text-green-600', bg: 'bg-green-50' };
      case 'REJECTED':
        return { label: 'Annulé', color: 'text-muted-foreground', bg: 'bg-muted' };
      default:
        return { label: status, color: 'text-foreground', bg: 'bg-muted' };
    }
  };

  const config = getStatusConfig(status);
  return (
    <View className={clsx('rounded-full px-2 py-0.5', config.bg)}>
      <Text className={clsx('text-xs font-medium', config.color)}>{config.label}</Text>
    </View>
  );
};

export default function ServiceListScreen() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const { location, error: locationError } = usePreciseLocation();

  const stableLoc = useMemo(() => {
    if (!location) return null;
    return {
      lat: location.latitude,
      long: location.longitude,
    };
  }, [location?.latitude, location?.longitude]);

  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [timeStr, setTimeStr] = useState('');

  //Mise a jour de la localisation
  const updateLocationMutation = useMutation(
    trpc.service.updateServiceLocation.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.service.getYoursServices.queryKey() });
        Alert.alert('Succès', 'Votre position a été enregistrée pour ce service.');
      },
    })
  );

  const { data, isLoading, refetch, isRefetching } = useQuery({
    ...trpc.service.getYoursServices.queryOptions({
      lat: stableLoc?.lat as number,
      long: stableLoc?.long as number,
    }),
    enabled: !!session?.user.id && !!stableLoc,
  });

  const openDialog = (item: any, type: DialogType) => {
    setSelectedItem(item);
    setActiveDialog(type);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setActiveDialog(null);
      setSelectedItem(null);
      resetForm();
      setRating(5);
      setTimeStr('');
    }, 300);
  };

  const careMutation = useMutation(
    trpc.service.careService.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.service.getYoursServices.queryKey() });
      },
    })
  );

  const cancelMutation = useMutation(
    trpc.service.cancelService.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.service.getYoursServices.queryKey() });
      },
    })
  );

  const finishMutation = useMutation(
    trpc.service.confirmService.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.service.getYoursServices.queryKey() });
      },
    })
  );

  const rateMutation = useMutation(
    trpc.service.rateService.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.service.getYoursServices.queryKey() });
        handleCloseDialog();
      },
    })
  );

  const markAsViewedMutation = useMutation(
    trpc.service.markServiceAsViewed.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.service.getYoursServices.queryKey() });
      },
    })
  );

  const setAppointmentMutation = useMutation(
    trpc.service.setAppointmentTime.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.service.getYoursServices.queryKey() });
        handleCloseDialog();
      },
    })
  );

  const {
    control,
    handleSubmit,
    reset: resetForm,
  } = useForm({
    resolver: zodResolver(secretCode),
  });

  useEffect(() => {
    if (data && session?.user?.id) {
      // @ts-ignore
      const providerId = session.user?.providerId;
      const unviewedServices = data.filter((s: any) => s.providerId === providerId && !s.isViewed);
      unviewedServices.forEach((s: any) => {
        markAsViewedMutation.mutate({ serviceId: s.id });
      });
    }

    return;
  }, [session, data]);

  if (!isPending && !session) {
    return (
      <SafeAreaView className="flex-1">
        <View className="bg-background h-screen">
          <View className="flex-1 items-center justify-center gap-6">
            <Text className="font-lg text-muted-foreground text-center text-xl">
              Vous devez être connecté pour accéder à cette page
            </Text>
            <Button variant="outline" onPress={() => router.push('/auth')} className="rounded-full">
              <Text>Se connecter</Text>
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: any }) => {
    if (!item) return null;

    const isCustomer = item.customerId === session?.user?.id;
    const partnerName = isCustomer ? item.provider.user.name : item.customer.name;
    const partnerRoleLabel = isCustomer ? 'Prestataire' : 'Client';

    return (
      <Card className="mx-2 my-2 gap-0 overflow-hidden border-none shadow-sm">
        <View
          className={clsx('h-1 w-full', {
            'bg-destructive': item.status === 'PENDING',
            'bg-primary': item.status === 'ACCEPTED',
            'bg-yellow-500': item.status === 'IN_PROGRESS',
            'bg-green-500': item.status === 'COMPLETED',
            'bg-muted': item.status === 'REJECTED',
          })}
        />
        <CardHeader className="flex-row items-start justify-between px-4 py-1.5">
          <View className="flex-1">
            <CardTitle className="text-lg font-bold">
              {item.skills?.title || item.title || 'Service sans titre'}
            </CardTitle>
            <CardDescription className="mt-1.5  w-full  text-wrap text-lg">
              {item.description}
            </CardDescription>
          </View>
          <StatusBadge status={item.status} />
        </CardHeader>

        <CardContent className="gap-3 px-4 py-0">
          <View className="flex-row flex-wrap items-center gap-1.5">
            <View className="bg-primary/10 flex-row items-center rounded-full px-2 py-1">
              <UserIcon size={12} className="text-primary mr-1" />
              <Text className="text-primary text-xs font-semibold">
                {partnerRoleLabel}: {partnerName}
              </Text>
            </View>
            <View className="bg-muted flex-row items-center rounded-full px-2 py-1">
              <CalendarClock size={12} className="text-muted-foreground mr-1" />
              <Text className="text-muted-foreground text-xs">
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
          </View>

          <View className="flex-row flex-wrap items-center gap-1.5">
           {!isCustomer && <View className="bg-muted flex-row items-center rounded-full px-2 py-1">
              <Locate size={12} className="text-muted-foreground mr-1" />
              <Text className="text-muted-foreground text-xs">{item?.distance?.toFixed(2)} km</Text>
            </View>}

            <View className="flex-row items-center gap-2">
              <Locate size={14} className="text-muted-foreground" />
              <Text className="text-muted-foreground text-sm">
                {item.district ?? item.customer.district ?? 'Quartier non renseigné'}
              </Text>
            </View>

            {!isCustomer && item.status === 'IN_PROGRESS' && (
              <Button
                className="w-fit rounded-full px-2"
                size={'iconSm'}
                onPress={() => {
                  let lat, long;

                  // 1. Localisation enregistrée avec le service
                  if (item.location && typeof item.location === 'object') {
                    if ('lat' in item.location && 'long' in item.location) {
                      lat = item.location.lat;
                      long = item.location.long;
                    } else if ('latitude' in item.location && 'longitude' in item.location) {
                      lat = item.location.latitude;
                      long = item.location.longitude;
                    }
                  }

                  // 2. Localisation en relation avec le client
                  if (lat === undefined || long === undefined) {
                    if (item.customer?.location && typeof item.customer.location === 'object') {
                      lat = item.customer.location.lat ?? item.customer.location.latitude;
                      long = item.customer.location.long ?? item.customer.location.longitude;
                    } else if (
                      item.customer?.Location &&
                      Array.isArray(item.customer.Location) &&
                      item.customer.Location.length > 0
                    ) {
                      const locInfo = item.customer.Location[0];
                      if (locInfo?.position?.coordinates) {
                        long = locInfo.position.coordinates[0];
                        lat = locInfo.position.coordinates[1];
                      } else if (locInfo?.lat !== undefined && locInfo?.long !== undefined) {
                        lat = locInfo.lat;
                        long = locInfo.long;
                      } else if (
                        locInfo?.latitude !== undefined &&
                        locInfo?.longitude !== undefined
                      ) {
                        lat = locInfo.latitude;
                        long = locInfo.longitude;
                      }
                    }
                  }

                  if (lat !== undefined && long !== undefined) {
                    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${long}`;
                    Linking.openURL(url);
                  } else {
                    // Fallback: Recherche par adresse
                    const searchQuery =
                      item.district || item.customer?.district || item.city || item.customer?.city;
                    if (searchQuery) {
                      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
                      Linking.openURL(url);
                    } else {
                      Alert.alert(
                        'Information',
                        'Aucune localisation précise enregistrée pour ce client.'
                      );
                    }
                  }
                }}>
                <Text className="text-white">Voir la localisation precise</Text>
              </Button>
            )}

            {isCustomer &&
              item.status !== 'COMPLETED' &&
              item.status !== 'REJECTED' &&
              (!item.location ||
                typeof item.location !== 'object' ||
                (!('lat' in item.location) && !('latitude' in item.location))) && (
                <Button
                  className="ml-2 w-fit rounded-full px-2"
                  size={'iconSm'}
                  variant="outline"
                  disabled={updateLocationMutation.isPending}
                  onPress={() => {
                    if (!stableLoc) {
                      Alert.alert(
                        'Erreur',
                        'Impossible de récupérer votre position. Vérifiez que la localisation est activée.'
                      );
                      return;
                    }
                    updateLocationMutation.mutate({
                      serviceId: item.id,
                      location: {
                        lat: stableLoc.lat,
                        long: stableLoc.long,
                      },
                    });
                  }}>
                  {updateLocationMutation.isPending ? (
                    <ActivityIndicator size="small" color="orange" />
                  ) : (
                    <Text className="text-primary text-xs font-bold">
                      Renseigner ma position GPS
                    </Text>
                  )}
                </Button>
              )}
          </View>

          {isCustomer && item.code && item.status !== 'COMPLETED' && (
            <View className="bg-primary/5 border-primary/20 mt-1 flex-row items-center justify-between rounded-xl border p-3">
              <View>
                <Text className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                  Code de confirmation
                </Text>
                <Text className="text-primary text-xl font-bold tracking-[6px]">{item.code}</Text>
              </View>
              <QrCode size="24" className="text-primary opacity-50" />
            </View>
          )}

          {item.appointmentTime && (
            <View className="mt-2 flex-row items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 p-2">
              <CalendarClock size={16} className="text-yellow-600" />
              <View>
                <Text className="text-[10px] font-bold text-yellow-600 uppercase">RDV Prévu</Text>
                <Text className="text-sm font-semibold text-yellow-700">
                  {item.appointmentTime}
                </Text>
              </View>
              {/*!item.appointmentTimeIsAccepted && (
                <Text className="ml-auto text-[10px] text-yellow-600 italic">En attente...</Text>
              )*/}
            </View>
          )}
        </CardContent>

        <CardFooter className="flex-row justify-end gap-2 p-4 py-1.5">
          {item.status !== 'COMPLETED' && item.status !== 'REJECTED' && (
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/20 rounded-full"
              onPress={() => openDialog(item, 'CANCEL')}>
              <Text className="text-destructive text-xs">Annuler</Text>
            </Button>
          )}

          {!isCustomer && item.status === 'PENDING' && (
            <Button
              size="sm"
              className="rounded-full px-6"
              onPress={() => openDialog(item, 'CARE')}>
              <Text className="text-xs font-bold text-white">Accepter</Text>
            </Button>
          )}

          {!isCustomer && item.status === 'IN_PROGRESS' && (
            <Button
              size="sm"
              className="rounded-full px-6"
              onPress={() => openDialog(item, 'FINISH')}>
              <Text className="text-xs font-bold text-white">Terminer</Text>
            </Button>
          )}

          {isCustomer && item.status === 'COMPLETED' && (
            <Button
              size="sm"
              variant="outline"
              className="border-primary rounded-full px-6"
              onPress={() => openDialog(item, 'RATE')}>
              <Text className="text-primary text-xs font-bold">Noter l'expérience</Text>
            </Button>
          )}

          {!item.appointmentTime &&
            !isCustomer &&
            item.status !== 'COMPLETED' &&
            item.status !== 'REJECTED' && (
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full px-4"
                onPress={() => openDialog(item, 'APPOINTMENT')}>
                <Text className="text-xs font-bold">RDV</Text>
              </Button>
            )}
        </CardFooter>
      </Card>
    );
  };

  const renderDialogContent = () => {
    if (!selectedItem) return null;

    // 1. DIALOGUE FINISH
    if (activeDialog === 'FINISH') {
      if (finishMutation.isSuccess) {
        return (
          <View className="items-center py-6">
            <Check size={48} color="#10B981" />
            <Text className="text-foreground mt-4 text-center text-xl font-bold">
              Service terminé !
            </Text>
            <Text className="text-muted-foreground mt-2 text-center">
              Le service a été validé avec succès.
            </Text>
            <Button className="mt-6 w-full rounded-full" onPress={handleCloseDialog}>
              <Text className="text-white">Génial !</Text>
            </Button>
          </View>
        );
      }

      return (
        <View className="gap-4 py-4">
          <View>
            <Text className="text-xl font-bold">Valider la mission</Text>
            <Text className="text-muted-foreground mt-1">
              Saisissez le code secret fourni par le client.
            </Text>
          </View>

          <Controller
            control={control}
            name="code"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View>
                <Input
                  placeholder="e4L45"
                  className="h-14 text-center text-2xl font-bold tracking-[10px]"
                  maxLength={5}
                  onChangeText={onChange}
                  value={value}
                />
                {(error || finishMutation.isError) && (
                  <Text className="text-destructive mt-2 text-center text-sm">
                    {error?.message || finishMutation.error?.message}
                  </Text>
                )}
              </View>
            )}
          />

          <View className="flex-row gap-3">
            <Button variant="ghost" className="flex-1" onPress={handleCloseDialog}>
              <Text>Annuler</Text>
            </Button>
            <Button
              className="flex-1 rounded-full"
              disabled={finishMutation.isPending}
              onPress={handleSubmit((data) =>
                finishMutation.mutateAsync({ ...data, serviceId: selectedItem.id })
              )}>
              <Text className="font-bold text-white">
                {finishMutation.isPending ? <ActivityIndicator color="white" /> : 'Confirmer'}
              </Text>
            </Button>
          </View>
        </View>
      );
    }

    // 2. DIALOGUE CARE
    if (activeDialog === 'CARE') {
      return (
        <View className="gap-4 py-4">
          <View className="items-center">
            <View className="bg-primary/10 rounded-full p-4">
              <Check size={32} className="text-primary" />
            </View>
            <Text className="mt-4 text-center text-xl font-bold">Accepter la mission ?</Text>
            <Text className="text-muted-foreground mt-2 text-center">
              En acceptant, vous vous engagez à réaliser ce service.
            </Text>
          </View>

          {careMutation.isError && (
            <Text className="text-destructive text-center">{careMutation.error?.message}</Text>
          )}

          <View className="flex-row gap-3">
            <Button variant="ghost" className="flex-1" onPress={handleCloseDialog}>
              <Text>Plus tard</Text>
            </Button>
            <Button
              className="flex-1 rounded-full"
              disabled={careMutation.isPending}
              onPress={() => careMutation.mutate({ serviceId: selectedItem.id })}>
              <Text className="font-bold text-white">
                {careMutation.isPending ? <ActivityIndicator color="white" /> : 'Accepter'}
              </Text>
            </Button>
          </View>
        </View>
      );
    }

    // 3. DIALOGUE CANCEL
    if (activeDialog === 'CANCEL') {
      return (
        <View className="gap-4 py-4">
          <View className="items-center">
            <View className="bg-destructive/10 rounded-full p-4">
              <AlertCircle size={32} className="text-destructive" />
            </View>
            <Text className="text-destructive mt-4 text-center text-xl font-bold">
              Annuler le service ?
            </Text>
            <Text className="text-muted-foreground mt-2 text-center">
              Annuler une mission déjà accepté peut affecter votre note
            </Text>
          </View>

          {cancelMutation.isError && (
            <Text className="text-destructive text-center">{cancelMutation.error?.message}</Text>
          )}

          <View className="flex-row gap-3">
            <Button variant="ghost" className="flex-1" onPress={handleCloseDialog}>
              <Text>Retour</Text>
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-full"
              disabled={cancelMutation.isPending}
              onPress={() => cancelMutation.mutate({ serviceId: selectedItem.id })}>
              <Text className="font-bold text-white">
                {cancelMutation.isPending ? <ActivityIndicator color="white" /> : 'Annuler'}
              </Text>
            </Button>
          </View>
        </View>
      );
    }

    // 4. RATE
    if (activeDialog === 'RATE') {
      return (
        <View className="gap-4 py-4">
          <View className="items-center">
            <Text className="text-xl font-bold">Comment c'était ?</Text>
            <Text className="text-muted-foreground mt-1 text-center">
              Votre avis aide la communauté SkillMap.
            </Text>
          </View>

          <RatingStars rating={rating} onRatingChange={setRating} />

          {rateMutation.isError && (
            <Text className="text-destructive text-center">{rateMutation.error?.message}</Text>
          )}

          <Button
            className="rounded-full"
            disabled={rateMutation.isPending}
            onPress={() =>
              rateMutation.mutate({
                serviceId: selectedItem.id,
                rating,
              })
            }>
            <Text className="font-bold text-white">
              {rateMutation.isPending ? <ActivityIndicator color="white" /> : 'Envoyer ma note'}
            </Text>
          </Button>
        </View>
      );
    }

    // 5. APPOINTMENT
    if (activeDialog === 'APPOINTMENT') {
      const handleSetAppointment = () => {
        if (!timeStr) return;
        {
          /* const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
          alert('Format invalide. Utilisez HH:MM');
          return;
        }*/
        }

        setAppointmentMutation.mutate({
          serviceId: selectedItem.id,
          appointmentTime: timeStr,
        });
      };

      return (
        <View className="gap-4 py-4">
          <View>
            <Text className="text-xl font-bold">Définir un rendez-vous</Text>
            <Text className="text-muted-foreground mt-1">
              Proposez une date et une heure au client. Vous acceptez de réaliser ce service.
            </Text>
          </View>

          <View className="gap-3">
            <View>
              <Text className="mb-1 text-sm font-medium">Heure (HH:MM)</Text>
              <Input
                placeholder="14:30"
                value={timeStr}
                onChangeText={setTimeStr}
                className="h-12"
              />
            </View>
          </View>

          {setAppointmentMutation.isError && (
            <Text className="text-destructive text-center">
              {setAppointmentMutation.error?.message}
            </Text>
          )}

          <View className="mt-4 flex-row gap-3">
            <Button variant="ghost" className="flex-1" onPress={handleCloseDialog}>
              <Text>Annuler</Text>
            </Button>
            <Button
              className="flex-1 rounded-full"
              disabled={setAppointmentMutation.isPending}
              onPress={handleSetAppointment}>
              <Text className="font-bold text-white">
                {setAppointmentMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  'Enregistrer'
                )}
              </Text>
            </Button>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View className="bg-background h-screen pb-30">
      {isLoading ? (
        <View className="h-full w-full flex-row items-center justify-center">
          <ActivityIndicator size={64} color={'orange'} />
        </View>
      ) : (
        <>
          {data && data?.length > 0 ? (
            <View className="flex-1 p-2">
              <FlatList
                data={data as unknown as any[]}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshing={isRefetching}
                onRefresh={refetch}
              />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center gap-6">
              <Text className="font-lg text-muted-foreground text-xl">
                Vous n'avez aucun service en cours
              </Text>
              <Button variant="outline" onPress={() => refetch()} className="rounded-full">
                <Text>Actualiser</Text>
              </Button>
            </View>
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="w-full min-w-xs rounded-2xl">
              {renderDialogContent()}
            </DialogContent>
          </Dialog>
        </>
      )}
    </View>
  );
}
