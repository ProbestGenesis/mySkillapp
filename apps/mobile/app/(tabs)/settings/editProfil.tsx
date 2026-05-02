import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FeedbackBanner } from '@/components/ui/utils/feedbackBanner';
import { availability } from '@/data/availability';
import { profession } from '@/data/selectProfessionData';
import { authClient } from '@/lib/auth-client';
import { updatePersonalProfileSchema, updateProviderProfileSchema } from '@/lib/zodSchema';
import { useTRPC } from '@/provider/appProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

export const occupations = [
  { label: 'PROFESSIONNEL', value: 'PROFESSIONNEL'},
  { label: 'ETUDIANT', value: 'ETUDIANT' },
];

export default function EditProfil() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session, refetch, isPending } = authClient.useSession();

  const [activeTab, setActiveTab] = useState('personal');
  const [success, setSuccess] = useState<{ message: string; type: 'success' | 'error' | null }>({
    message: '',
    type: null,
  });

  useEffect(() => {
    if (success.message && success.type === 'success') {
      const timer = setTimeout(() => {
        setSuccess({ message: '', type: null });
        refetch();
        router.back();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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

  const { data: userData, isLoading: isUserLoading } = useQuery(
    trpc.user.getUserWithProviderData.queryOptions({ userId: session?.user.id as string })
  );

  const { mutateAsync: updatePersonal, isPending: isUpdatingPersonal } = useMutation(
    trpc.user.updatePersonalProfile.mutationOptions()
  );

  const { mutateAsync: updateProvider, isPending: isUpdatingProvider } = useMutation({
    ...trpc.user.updateProviderProfile.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(
        trpc.user.getUserWithProviderData.queryOptions({ userId: session?.user.id as string })
      );
    }
  });

  const profilePictureMutation = useMutation({
    ...trpc.user.updateProfilePicture.mutationOptions(),
    onSuccess: async (data) => {
      await authClient.updateUser({
        image: data.imageUrl,
      });
      setSuccess({ message: data.message, type: 'success' });
      queryClient.invalidateQueries(
        trpc.user.getUserWithProviderData.queryOptions({ userId: session?.user.id as string })
      );
    },
    onError: (error) => {
      setSuccess({ message: error.message || "Une erreur s'est produite", type: 'error' });
    },
  });

  const personalForm = useForm<z.infer<typeof updatePersonalProfileSchema>>({
    resolver: zodResolver(updatePersonalProfileSchema),
  });

  const providerForm = useForm<z.infer<typeof updateProviderProfileSchema>>({
    //@ts-ignore
    resolver: zodResolver(updateProviderProfileSchema),
  });

  useEffect(() => {
    if (userData) {
      personalForm.reset({
        name: userData.name || '',
        phoneNumber: userData.phoneNumber || '',
        city: userData.city || '',
        district: userData.district || '',
      });
      if (userData.provider) {
        providerForm.reset({
          profession: { value: userData.provider.profession, label: userData.provider.profession },
          bio: userData.provider.bio || '',
          experience: userData.provider.experience,
          availability: {
            value: (userData.provider.availability as any) || '7j/7',
            label: (userData.provider.availability as any) || '7j/7',
          },
          average_price: userData.provider.average_price?.toString() || '',
        });
      }
    }
  }, [userData]);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      profilePictureMutation.mutate({
        base64: result.assets[0].base64,
        mimeType: result.assets[0].mimeType || 'image/jpeg',
        fileName: result.assets[0].fileName || 'profile.jpg',
      });
    }
  };

  const onPersonalSubmit = async (data: z.infer<typeof updatePersonalProfileSchema>) => {
    try {
      const res = await updatePersonal(data);
      if (res.ok) {
        setSuccess({ message: res.message, type: 'success' });
        refetch();
        queryClient.invalidateQueries(
          trpc.user.getUserWithProviderData.queryOptions({ userId: session?.user.id as string })
        );
      }
    } catch (error: any) {
      if (error instanceof TRPCClientError) {
        setSuccess({ message: error.message, type: 'error' });
      }
      setSuccess({ message: error.message || 'Une erreur est survenue', type: 'error' });
    }
  };

  const onProviderSubmit = async (data: z.infer<typeof updateProviderProfileSchema>) => {
    try {
      const res = await updateProvider(data);
      if (res.ok) {
        setSuccess({ message: res.message, type: 'success' });
        queryClient.invalidateQueries(
          trpc.user.getUserWithProviderData.queryOptions({ userId: session?.user.id as string })
        );
      }
    } catch (error: any) {
      setSuccess({ message: error.message || 'Une erreur est survenue', type: 'error' });
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'provider' && userData?.role !== 'PROVIDER') {
      router.push('/(tabs)/settings/provider');
      return;
    }
    setActiveTab(tab);
    setSuccess({ message: '', type: null });
  };

  if (isUserLoading) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  
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

  return (
    <KeyboardAvoidingView
      className="bg-background mt-2 flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full px-4">
          {/* ── TabsList ── */}
          <TabsList className="mb-6 grid w-full grid-cols-2 gap-8">
            <TabsTrigger value="personal" className="w-1/2">
              <Text className="font-semibold">Général</Text>
            </TabsTrigger>
            <TabsTrigger value="provider" className="w-1/2">
              <Text className="font-semibold">Prestation</Text>
            </TabsTrigger>
          </TabsList>

          {/* ── Tab Général ── */}
          <TabsContent value="personal" className="gap-4  pb-30">
            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              className="gap-4">
              {/* Profile Picture Section */}
              <View className="items-center justify-center py-4">
                <View className="relative">
                  <Avatar
                    alt="user profil"
                    className="border-primary/10 h-32 w-32 rounded-full border-4">
                    <AvatarImage source={{ uri: session?.user?.image || undefined }} />
                    <AvatarFallback>
                      <Text className="text-2xl font-bold">
                        {session?.user?.name?.slice(0, 2).toUpperCase()}
                      </Text>
                    </AvatarFallback>
                  </Avatar>
                  {profilePictureMutation.isPending && (
                    <View className="absolute inset-0 items-center justify-center rounded-full bg-black/20">
                      <ActivityIndicator color="white" />
                    </View>
                  )}
                </View>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onPress={handlePickImage}
                  disabled={profilePictureMutation.isPending}>
                  <Text className="text-primary font-semibold">Modifier la photo</Text>
                </Button>
              </View>

              {/* Nom */}
              <View>
                <Label className="mb-2 font-semibold">Nom Complet</Label>
                <Controller
                  control={personalForm.control}
                  name="name"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View>
                      <Input
                        placeholder="Votre nom"
                        onChangeText={onChange}
                        value={value}
                        className="h-12 rounded-xl"
                      />
                      {error && <Text className="mt-1 text-xs text-red-500">{error.message}</Text>}
                    </View>
                  )}
                />
              </View>

              {/* Téléphone */}
              <View>
                <Label className="mb-2 font-semibold">Numéro de téléphone</Label>
                <Controller
                  control={personalForm.control}
                  name="phoneNumber"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View>
                      <Input
                        placeholder="Ex: 0102030405"
                        onChangeText={onChange}
                        value={value}
                        className="h-12 rounded-xl"
                        keyboardType="phone-pad"
                      />
                      {error && <Text className="mt-1 text-xs text-red-500">{error.message}</Text>}
                    </View>
                  )}
                />
              </View>

              {/* Ville / Quartier */}
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Label className="mb-2 font-semibold">Ville</Label>
                  <Controller
                    control={personalForm.control}
                    name="city"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <View>
                        <Input
                          placeholder="Ville"
                          onChangeText={onChange}
                          value={value}
                          className="h-12 rounded-xl"
                        />
                        {error && (
                          <Text className="mt-1 text-xs text-red-500">{error.message}</Text>
                        )}
                      </View>
                    )}
                  />
                </View>
                <View className="flex-1">
                  <Label className="mb-2 font-semibold">Quartier</Label>
                  <Controller
                    control={personalForm.control}
                    name="district"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <View>
                        <Input
                          placeholder="Quartier"
                          onChangeText={onChange}
                          value={value}
                          className="h-12 rounded-xl"
                        />
                        {error && (
                          <Text className="mt-1 text-xs text-red-500">{error.message}</Text>
                        )}
                      </View>
                    )}
                  />
                </View>
              </View>

              {/* Submit */}
              <Button
                className="bg-primary mt-6 h-14 rounded-full"
                onPress={personalForm.handleSubmit(onPersonalSubmit)}
                disabled={isUpdatingPersonal}>
                {isUpdatingPersonal ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-lg font-bold text-white">Mettre à jour</Text>
                )}
              </Button>

              {/* Feedback */}
              <FeedbackBanner success={success} />
            </MotiView>
          </TabsContent>

          {/* ── Tab Prestation ── */}
          <TabsContent value="provider" className="gap-4  pb-30">
            <MotiView
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              className="gap-4">
              {/* Profession */}
              <View>
                <Label className="mb-2 font-semibold">Profession</Label>
                <Controller
                  control={providerForm.control}
                  name="profession"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View>
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
                      {error && <Text className="mt-1 text-xs text-red-500">{error.message}</Text>}
                    </View>
                  )}
                />
              </View>

              {/* Bio */}
              <View>
                <Label className="mb-2 font-semibold">Bio </Label>
                <Controller
                  control={providerForm.control}
                  name="bio"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View>
                      <Textarea
                        placeholder="Décrivez vos services..."
                        onChangeText={onChange}
                        value={value}
                        className="min-h-[120px] rounded-xl"
                        multiline
                      />
                      {error && <Text className="mt-1 text-xs text-red-500">{error.message}</Text>}
                    </View>
                  )}
                />
              </View>

              <View className="flex-row gap-4">
                <Controller
                  name="experience"
                  control={providerForm.control}
                  defaultValue={1}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View className="flex-1">
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
                  control={providerForm.control}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View className="flex-1">
                      <Label className="font-bold">Ocupation</Label>
                      <Select
                        onValueChange={(v: any) => onChange(v)}
                        value={value}
                        defaultValue={value}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={String(value ?? '')} />
                        </SelectTrigger>
                        <SelectContent insets={contentInsets}>
                          <SelectGroup>
                            <SelectLabel>Métiers</SelectLabel>
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

              {/* Disponibilité / Prix */}
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Label className="mb-2 font-semibold">Disponibilité</Label>
                  <Controller
                    control={providerForm.control}
                    name="availability"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <View>
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
                        {error && (
                          <Text className="mt-1 text-xs text-red-500">{error.message}</Text>
                        )}
                      </View>
                    )}
                  />
                </View>

                <View className="flex-1">
                  <Label className="mb-2 font-semibold">Prix de base (FCFA)</Label>
                  <Controller
                    control={providerForm.control}
                    name="average_price"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <View>
                        <Input
                          placeholder="Prix"
                          onChangeText={onChange}
                          value={value}
                          className="h-12 rounded-xl"
                          keyboardType="numeric"
                        />
                        {error && (
                          <Text className="mt-1 text-xs text-red-500">{error.message}</Text>
                        )}
                      </View>
                    )}
                  />
                </View>
              </View>
              <View>
                <Text className="text-muted">
                  *Le rix de base est le prix en dessous de quel vous ne souhaitez pas être
                  contacté{' '}
                </Text>
              </View>
              {/* Submit */}
              <Button
                className="bg-primary mt-6 h-14 rounded-full"
                //@ts-ignore
                onPress={providerForm.handleSubmit(onProviderSubmit)}
                disabled={isUpdatingProvider}>
                {isUpdatingProvider ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-lg font-bold text-white">Mettre à jour</Text>
                )}
              </Button>

              {/* Feedback */}
              {/* <FeedbackBanner success={success} /> */}
            </MotiView>
          </TabsContent>
        </Tabs>

        <View className="h-20" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
