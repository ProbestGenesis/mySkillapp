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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import * as ImagePicker from 'expo-image-picker';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger  } from '@/components/ui/tabs';
import { availability as availabilityData } from '@/data/availability';
import { profession as professionData } from '@/data/selectProfessionData';
import { authClient } from '@/lib/auth-client';
import { updatePersonalProfileSchema, updateProviderProfileSchema } from '@/lib/zodSchema';
import { useTRPC } from '@/provider/appProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { TRPCClientError } from '@trpc/client';

export default function EditProfil() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('personal');
  const [success, setSuccess] = useState<{ message: string; type: 'success' | 'error' | null }>({
    message: '',
    type: null,
  });

  useEffect(() => {
    if (success.message && success.type === 'success') {
      const timer = setTimeout(() => setSuccess({ message: '', type: null }), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const { data: userData, isLoading: isUserLoading } = useQuery(
    trpc.user.getUserWithProviderData.queryOptions({ userId: session?.user.id as string })
  );

  const { mutateAsync: updatePersonal, isPending: isUpdatingPersonal } = useMutation(
    trpc.user.updatePersonalProfile.mutationOptions()
  );

  const { mutateAsync: updateProvider, isPending: isUpdatingProvider } = useMutation(
    trpc.user.updateProviderProfile.mutationOptions()
  );

  const profilePictureMutation = useMutation({
    ...trpc.user.updateProfilePicture.mutationOptions(),
    onSuccess: async (data) => {
      await authClient.updateUser({
        image: data.imageUrl,
      });
      setSuccess({ message: data.message, type: 'success' });
      queryClient.invalidateQueries(trpc.user.getUserWithProviderData.queryOptions({ userId: session?.user.id as string }));
    },
    onError: (error) => {
      setSuccess({ message: error.message || "Une erreur s'est produite", type: 'error' });
    },
  });

  const personalForm = useForm<z.infer<typeof updatePersonalProfileSchema>>({
    resolver: zodResolver(updatePersonalProfileSchema),
  });

  const providerForm = useForm<z.infer<typeof updateProviderProfileSchema>>({
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
        queryClient.invalidateQueries(
          trpc.user.getUserWithProviderData.queryOptions({ userId: session?.user.id as string })
        );
      }
    } catch (error: any) {
      if(error instanceof TRPCClientError){
        setSuccess({message: error.message, type: "error"})
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
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <View className="h-full mt-2 bg-background">
      
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full px-4">
            {/* ── TabsList ── */}
            <TabsList className="grid w-full gap-8 grid-cols-2 mb-6">
              <TabsTrigger value="personal" className="w-1/2">
                <Text className="font-semibold">Général</Text>
              </TabsTrigger>
              <TabsTrigger value="provider" className="w-1/2">
                <Text className="font-semibold ">Prestation</Text>
              </TabsTrigger>
            </TabsList>

            {/* ── Tab Général ── */}
            <TabsContent value="personal" className="gap-4">
              <MotiView
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                className="gap-4">
                
                {/* Profile Picture Section */}
                <View className="items-center justify-center py-4">
                  <View className="relative">
                    <Avatar alt="user profil" className="h-32 w-32 border-4 border-primary/10 rounded-full">
                      <AvatarImage
                        source={{ uri: session?.user?.image || undefined }}
                      />
                      <AvatarFallback>
                        <Text className="text-2xl font-bold">{session?.user?.name?.slice(0, 2).toUpperCase()}</Text>
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
                    <Text className="font-semibold text-primary">Modifier la photo</Text>
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
                          {error && <Text className="mt-1 text-xs text-red-500">{error.message}</Text>}
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
                          {error && <Text className="mt-1 text-xs text-red-500">{error.message}</Text>}
                        </View>
                      )}
                    />
                  </View>
                </View>

                {/* Submit */}
                <Button
                  className="mt-6 h-14 rounded-full bg-primary"
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
            <TabsContent value="provider" className="gap-4">
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
                          onValueChange={(v: any) => {
                            const item = professionData.find((p) => p.value === v);
                            if (item) onChange(item);
                          }}
                          value={value?.value}
                          defaultValue={value?.value}>
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Sélectionner votre profession" />
                          </SelectTrigger>
                          <SelectContent
                            insets={{ top: insets.top, bottom: insets.bottom, left: 16, right: 16 }}>
                            <SelectGroup>
                              <SelectLabel>Professions</SelectLabel>
                              {professionData.map((item) => (
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
                  <Label className="mb-2 font-semibold">Bio / Expérience</Label>
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
                            onValueChange={(v: any) => {
                              const item = availabilityData.find((a) => a.value === v);
                              if (item) onChange(item);
                            }}
                            value={value?.value}
                            defaultValue={value?.value}>
                            <SelectTrigger className="h-12 rounded-xl">
                              <SelectValue placeholder="Dispo" />
                            </SelectTrigger>
                            <SelectContent
                              insets={{ top: insets.top, bottom: insets.bottom, left: 16, right: 16 }}>
                              <SelectGroup>
                                <SelectLabel>Disponibilités</SelectLabel>
                                {availabilityData.map((item) => (
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
                          {error && <Text className="mt-1 text-xs text-red-500">{error.message}</Text>}
                        </View>
                      )}
                    />
                  </View>
                </View>

                {/* Submit */}
                <Button
                  className="mt-6 h-14 rounded-full bg-primary"
                  onPress={providerForm.handleSubmit(onProviderSubmit)}
                  disabled={isUpdatingProvider}>
                  {isUpdatingProvider ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-lg font-bold text-white">Mettre à jour</Text>
                  )}
                </Button>

                {/* Feedback */}
                <FeedbackBanner success={success} />
              </MotiView>
            </TabsContent>
          </Tabs>

          <View className="h-20" />
        </ScrollView>
      
    </View>
  );
}

/* ── Composant feedback réutilisable ── */
function FeedbackBanner({
  success,
}: {
  success: { message: string; type: 'success' | 'error' | null };
}) {
  if (!success.message) return null;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx('mt-4 p-4 rounded-xl items-center', {
        'bg-green-100': success.type === 'success',
        'bg-red-100': success.type === 'error',
      })}>
      <Text
        className={clsx('font-bold text-center', {
          'text-green-700': success.type === 'success',
          'text-red-700': success.type === 'error',
        })}>
        {success.message}
      </Text>
    </MotiView>
  );
}