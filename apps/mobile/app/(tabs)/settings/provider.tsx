import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { availability } from '@/data/availability';
import { profession } from '@/data/selectProfessionData';
import { authClient } from '@/lib/auth-client';
import { usePreciseLocation } from '@/lib/geolocation';
import { createProvider } from '@/lib/zodSchema';
import { useTRPC } from '@/provider/appProvider';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useRouter } from 'expo-router';
import { AnimatePresence, MotiView } from 'moti';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { occupations } from './editProfil';

type Props = {
  onComplete?: () => void;
};

export default function BecomeProvider({}: Props) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient()
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { location, error: locationError, permissionGranted } = usePreciseLocation();

  const [success, setSuccess] = useState<{
    message: string | undefined;
    status: number | null;
  }>({ message: '', status: null });

  const [closeLanding, setCloseLanding] = useState(false);

  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: Platform.select({
      ios: insets.bottom,
      android: insets.bottom + 24,
    }),
    left: 12,
    right: 12,
  };

  const { handleSubmit, control } = useForm({
    resolver: zodResolver(createProvider),
  });

  const { mutateAsync: createProviderMutation, isPending } = useMutation({
    ...trpc.user.createProvider.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: trpc.user.getUserWithProviderData.queryKey()})
    }
  });

  useEffect(() => {
    if (locationError) {
      alert(locationError);
    }
  }, [locationError, permissionGranted]);

  const handleCloseLanding = () => {
    setCloseLanding(true);
  };

  const onSubmit = async (data: z.infer<typeof createProvider>) => {
    try {
      await createProviderMutation(data);
      setSuccess({
        message: 'Félicitation, vous êtes devenu(e) un prestataire de service',
        status: 201,
      });
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err: any) {
      if (err?.data?.code === 'UNAUTHORIZED') {
        setSuccess({ message: "Erreur d'authentification", status: 401 });
      } else {
        setSuccess({ message: err?.message ?? 'Une erreur est survenue', status: 400 });
      }
    }
  };

  if (!sessionPending && !session) {
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

  return (
    <View className="flex-1">
      <AnimatePresence exitBeforeEnter>
        {closeLanding ? (
          <MotiView
            key="next"
            from={{ opacity: 0, scale: 0.9, translateY: 30 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 180, mass: 0.8 }}
            className="h-full">
            <View className="flex-col gap-6 px-4 pt-5">
              <Controller
                control={control}
                name="profession"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label className="text-lg font-bold">Votre profession</Label>
                    <Select
                      onValueChange={(v: any) => onChange(v)}
                      value={value}
                      defaultValue={value}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selectionner votre profession" />
                      </SelectTrigger>
                      <SelectContent insets={contentInsets}>
                        <SelectGroup>
                          <SelectLabel>Professions</SelectLabel>
                          {profession.map((item) => (
                            //@ts-ignore
                            <SelectItem key={item.value} label={item.label} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {error?.message && (
                      <Text className="mt-1 text-sm text-red-600">{error.message}</Text>
                    )}
                  </View>
                )}
              />

              <Controller
                name="bio"
                control={control}
                defaultValue=""
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View className="w-full">
                    <Label className="text-lg font-bold">Parlez-nous de vous</Label>
                    <Textarea
                      placeholder="Décrivez vos compétences, expériences, etc."
                      onChangeText={onChange}
                      value={value}
                      className="mt-1 h-32"
                      multiline
                      textAlignVertical="top"
                    />
                    {error?.message && (
                      <Text className="mt-1 text-sm text-red-600">{error.message}</Text>
                    )}
                  </View>
                )}
              />

              <View className="flex-row flex-wrap items-center gap-4">
                <Controller
                  name="experience"
                  control={control}
                  defaultValue={1}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View className="w-full flex-1">
                      <Label className="font-bold">Années d'expérience</Label>
                      <Input
                        placeholder="Ex: 2"
                        onChangeText={(text) => onChange(Number(text))}
                        value={String(value ?? '')}
                        className="mt-1 h-12"
                        keyboardType="number-pad"
                      />
                      {error?.message && (
                        <Text className="mt-1 text-sm text-red-600">{error.message}</Text>
                      )}
                    </View>
                  )}
                />

                <Controller
                  name="occupation"
                  control={control}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View className="w-full flex-1">
                      <Label className="font-bold">Ocupation</Label>
                      <Select
                        onValueChange={(v: any) => onChange(v)}
                        value={value}
                        defaultValue={value}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={String(value ?? 'PROFESSIONNEL')} />
                        </SelectTrigger>
                        <SelectContent insets={contentInsets}>
                          <SelectGroup>
                            <SelectLabel>Occupations</SelectLabel>
                            {occupations.map((item: any, idx: number) => (
                              //@ts-ignore
                              <SelectItem key={idx} label={item.label} value={item.value}>
                                {item.value}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {error?.message && (
                        <Text className="mt-1 text-sm text-red-600">{error.message}</Text>
                      )}
                    </View>
                  )}
                />
              </View>

              <Controller
                control={control}
                name="availability"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label className="text-lg font-bold">Votre disponibilité</Label>
                    <Select
                      onValueChange={(v: any) => onChange(v)}
                      value={value}
                      defaultValue={value}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Sélectionner votre disponibilité" />
                      </SelectTrigger>
                      <SelectContent insets={contentInsets}>
                        <SelectGroup>
                          <SelectLabel>Disponibilités</SelectLabel>
                          {availability.map((item: any) => (
                            //@ts-ignore
                            <SelectItem key={item.value} label={item.label} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {error?.message && (
                      <Text className="mt-1 text-sm text-red-600">{error.message}</Text>
                    )}
                  </View>
                )}
              />

              <Button
                className="rounded-full"
                disabled={isPending}
                onPress={handleSubmit((data) => onSubmit(data))}>
                {isPending ? (
                  <ActivityIndicator size={24} color={'white'} />
                ) : (
                  <Text className="font-bold text-white">Enregistrer</Text>
                )}
              </Button>

              {success.message ? (
                <Text
                  className={clsx('text-center font-bold', {
                    'text-green-600': success.status === 201,
                    'text-destructive': success.status !== 201 && success.status !== null,
                  })}>
                  {success.message}
                </Text>
              ) : null}
            </View>
          </MotiView>
        ) : (
          <MotiView
            key="landing"
            from={{ opacity: 0, scale: 0.9, translateY: 30 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', damping: 14, stiffness: 180, mass: 0.8 }}
            className="flex-1 justify-between px-6 py-10">
            <View>
              <Text className="text-center text-2xl font-extrabold">
                🎯 Bienvenue sur <Text className="text-primary">SKILLMAP</Text>
              </Text>
              <Text className="mt-2 text-center text-base text-gray-600">
                La plateforme de toutes les opportunités pour les pros de la prestation de services.
              </Text>
            </View>

            <View className="items-center">
              <Ionicons name="construct-outline" size={120} color="#FDBA74" />
            </View>

            <View className="gap-4">
              <Text className="text-center text-sm font-semibold text-gray-700">
                Trouvez rapidement un client dans votre zone
              </Text>
              <Pressable
                onPress={handleCloseLanding}
                className="bg-primary flex-row items-center justify-center gap-2 rounded-full py-3 active:opacity-80">
                <Text className="text-base font-medium text-white">Devenir prestataire</Text>
              </Pressable>
            </View>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}
