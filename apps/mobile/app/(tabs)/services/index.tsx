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
import { authClient } from '@/lib/auth-client';
import { secretCode } from '@/lib/zodSchema';

import { useTRPC } from '@/provider/appProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useRouter } from 'expo-router';
import { AlertCircle, CalendarClock, Check, Locate, QrCode, UserIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { Star } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

type DialogType = 'CARE' | 'CANCEL' | 'FINISH' | 'RATE' | null;

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
      case 'pending':
        return { label: 'En attente', color: 'text-destructive', bg: 'bg-destructive/10' };
      case 'in_progress':
        return { label: 'En cours', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'completed':
        return { label: 'Terminé', color: 'text-green-600', bg: 'bg-green-50' };
      case 'cancelled':
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
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rating, setRating] = useState(5);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    ...trpc.service.getYoursServices.queryOptions(),
    enabled: !!session?.user.id,
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

  const {
    control,
    handleSubmit,
    reset: resetForm,
  } = useForm({
    resolver: zodResolver(secretCode),
  });

  useEffect(() => {
    if (!session) {
      router.push('/auth');
    }

    return;
  }, [session]);

  const renderItem = ({ item }: { item: any }) => {
    const role = session?.user.role;
    if (!item) return null;

    return (
      <Card className="mx-2 my-2 overflow-hidden border-none shadow-sm">
        <View
          className={clsx('h-1 w-full', {
            'bg-destructive': item.status === 'pending',
            'bg-yellow-500': item.status === 'in_progress',
            'bg-green-500': item.status === 'completed',
            'bg-muted': item.status === 'cancelled',
          })}
        />
        <CardHeader className="flex-row items-start justify-between p-4">
          <View className="flex-1">
            <CardTitle className="text-lg font-bold">
              {item.skills?.title || item.title || 'Service sans titre'}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">{item.description}</CardDescription>
          </View>
          <StatusBadge status={item.status} />
        </CardHeader>

        <CardContent className="gap-3 px-4 py-0">
          <View className="flex-row items-center gap-2">
            <View className="bg-primary/10 flex-row items-center rounded-full px-2 py-1">
              <UserIcon size={12} className="text-primary mr-1" />
              <Text className="text-primary text-xs font-semibold">
                {role === 'Customer' ? 'Prestataire' : 'Client'}: {item.provider.user.name}
              </Text>
            </View>
            <View className="bg-muted flex-row items-center rounded-full px-2 py-1">
              <CalendarClock size={12} className="text-muted-foreground mr-1" />
              <Text className="text-muted-foreground text-xs">
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <Locate size={14} className="text-muted-foreground" />
            <Text className="text-muted-foreground text-sm">
              {item.district || 'Quartier non renseigné'}
            </Text>
          </View>

          {role === 'Customer' && item.code && item.status !== 'completed' && (
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
        </CardContent>

        <CardFooter className="flex-row justify-end gap-2 p-4">
          {item.status !== 'completed' && item.status !== 'cancelled' && (
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/20 rounded-full"
              onPress={() => openDialog(item, 'CANCEL')}>
              <Text className="text-destructive text-xs">Annuler</Text>
            </Button>
          )}

          {role === 'Provider' && item.status === 'pending' && (
            <Button
              size="sm"
              className="rounded-full px-6"
              onPress={() => openDialog(item, 'CARE')}>
              <Text className="text-xs font-bold text-white">Accepter</Text>
            </Button>
          )}

          {role === 'Provider' && item.status === 'in_progress' && (
            <Button
              size="sm"
              className="rounded-full px-6"
              onPress={() => openDialog(item, 'FINISH')}>
              <Text className="text-xs font-bold text-white">Terminer</Text>
            </Button>
          )}

          {role === 'Customer' && item.status === 'completed' && (
            <Button
              size="sm"
              variant="outline"
              className="border-primary rounded-full px-6"
              onPress={() => openDialog(item, 'RATE')}>
              <Text className="text-primary text-xs font-bold">Noter l'expérience</Text>
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
            <Button className="mt-6 w-full rounded-xl" onPress={handleCloseDialog}>
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
                  placeholder="Ex: 12345"
                  className="h-14 text-center text-2xl font-bold tracking-[10px]"
                  keyboardType="number-pad"
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
              className="flex-1 rounded-xl"
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
              className="flex-1 rounded-xl"
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
              Cette action informera l'autre partie de l'annulation.
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
              className="flex-1 rounded-xl"
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
            className="rounded-xl"
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

    return null;
  };

  return (
    <View className="bg-background flex-1">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground text-xl font-bold">Chargement ...</Text>
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
              <Button variant="outline" onPress={() => refetch()}>
                <Text>Actualiser</Text>
              </Button>
            </View>
          )}

          {/* --- LE DIALOGUE GLOBAL --- */}
          {/* Il est rendu HORS de la liste, une seule fois */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="w-[90%] rounded-2xl">{renderDialogContent()}</DialogContent>
          </Dialog>
        </>
      )}
    </View>
  );
}
