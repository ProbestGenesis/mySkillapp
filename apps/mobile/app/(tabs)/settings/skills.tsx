import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { authClient } from '@/lib/auth-client';
import { createSkill } from '@/lib/zodSchema';
import { useTRPC } from '@/provider/appProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import clsx from 'clsx';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { z } from 'zod';

type FormData = z.infer<typeof createSkill>;

export default function AddSkills() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const { providerId } = useLocalSearchParams();
  if (!providerId) {
    router.push('/(tabs)/settings/provider');
  }
  const [success, setSuccess] = useState<{ message: string; type: 'success' | 'error' }>({
    message: '',
    type: 'success',
  });
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createSkill),
  });

  const {
    mutateAsync: addSkills,
    isPending,
    error,
  } = useMutation({
    ...trpc.providers.addSkill.mutationOptions(),
    onSuccess: () => {
         queryClient.invalidateQueries(
           trpc.user.getUserWithProviderData.queryOptions({ userId: session?.user.id as string })
         );
      }
  });

  const onSubmit = async (data: FormData) => {
    try {
      await addSkills(data);

      setSuccess({ message: 'Votre services a été enregistré', type: 'success' });
      router.back()
    } catch (error: any) {
      if (error instanceof TRPCClientError) {
        if (error?.data?.code === 'UNAUTHORIZED') {
          setSuccess({
            message: "Erreur d'authentification, veuillez vous reconnecter",
            type: 'error',
          });
          return;
        }
        setSuccess({ message: error.message, type: 'error' });
      }
    } finally {
      setTimeout(() => {
        setSuccess({ message: '', type: 'success' });
        router.back()
      }, 2000);
    }
  };

  useEffect(() => {
    if (!session) {
      router.replace('/auth');
    }

    return;
  }, [session]);

  return (
    <MotiView
      key="form"
      from={{ opacity: 0, scale: 0.95 }} // Scale moins agressif
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        type: 'timing',
        duration: 250,
      }}
      className="flex-1 bg-white" // bg-white important
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView contentContainerClassName="px-4 pt-10 pb-10 gap-3.5">
          {/* Title */}
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value, onBlur } }) => (
              <View>
                <Label>
                  <Text className="font-bold">Nom du service</Text>
                </Label>
                <Input
                  className="rounded-md border border-gray-300 px-3 py-2 text-base"
                  placeholder="Ex: Installation d'antenne parabolique"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {errors.title && (
                  <Text className="mt-1 text-xs text-red-500">{errors.title.message}</Text>
                )}
              </View>
            )}
          />

          {/* Description */}
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value, onBlur } }) => (
              <View>
                <Label>
                  <Text className="font-bold">Description </Text>
                </Label>
                <Textarea
                  placeholder="Décris ton service en détail..."
                  multiline
                  className="h-32" // Hauteur fixe pour éviter les sauts de layout
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {errors.description && (
                  <Text className="mt-1 text-xs text-red-500">{errors.description.message}</Text>
                )}
              </View>
            )}
          />

          {/* Average Price */}
          <Controller
            control={control}
            name="averagePrice"
            render={({ field: { onChange, value, onBlur } }) => (
              <View className="mb-2">
                <Text className="font-bold">Prix moyen</Text>
                <Input
                  className="rounded-md border border-gray-300 px-3 py-2 text-base"
                  placeholder="Ex: 150"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                <Text className="mt-1 text-xs text-gray-500">
                  *le prix de base est le cout pour un travail standard
                </Text>
                {errors.averagePrice && (
                  <Text className="mt-1 text-xs text-red-500">{errors.averagePrice.message}</Text>
                )}
              </View>
            )}
          />

          {/* Submit Button */}
          <Button onPress={handleSubmit(onSubmit)} disabled={isPending} className="mt-4">
            <Text className="font-bold text-white">
              {isPending ? <ActivityIndicator size={24} color={'white'} /> : 'Ajouter le service'}
            </Text>
          </Button>

          {success.message && (
            <Text
              className={clsx('mt-4 text-center font-bold', {
                'text-green-600': success.type === 'success',
                'text-destructive': success.type === 'error',
              })}>
              {success.message}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </MotiView>
  );
}
