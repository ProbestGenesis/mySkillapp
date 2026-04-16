import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { authClient } from '@/lib/auth-client';
import { postsSchema as formSchema } from '@/lib/zodSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { TRPCClientError } from '@trpc/client';
import clsx from 'clsx';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { profession } from '@/data/selectProfessionData';
import { useTRPC } from '@/provider/appProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MotiView } from 'moti';

type Props = {
  onClose: () => void;
};
function AddPostCard({ onClose }: Props) {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

  const [success, setSuccess] = useState<{
    message?: string;
    status: number | null;
  }>({ message: '', status: null });
  const trpc = useTRPC();
  const { handleSubmit, control } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const {
    mutateAsync: createPost,
    isPending,
    error,
  } = useMutation({
    ...trpc.post.createPost.mutationOptions(),
    onSuccess: () => {
      setSuccess({
        message: 'Publication ajoutée avec succèss',
        status: 201,
      });
      queryClient.invalidateQueries(trpc.post.listMyPosts.queryOptions());
      setTimeout(() => {
        setSuccess({
          message: '',
          status: null,
        });
        onClose();
      }, 1000);
    },

    onError: (error: any) => {
      if (error instanceof TRPCClientError) {
        setSuccess({
          message: error.message,
          status: 500,
        });
      }

      if (error) {
        setSuccess({
          message: "Une erreur s'est produite",
          status: 500,
        });
      }
    },
  });

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
  return (
    <MotiView
      from={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ type: 'spring', duration: 400 }}
      className="relative mx-auto mt-2.5 w-screen px-2">
      <Card>
        <CardHeader>
          <CardTitle>Demande de service</CardTitle>
        </CardHeader>

        <CardContent className="w-full flex-col gap-2.5">
          <Controller
            control={control}
            name="profession"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View>
                <Label className="">Metier recherché</Label>

                <Select onValueChange={(v: any) => onChange(v)} value={value} defaultValue={value}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selectionner votre professions" />
                  </SelectTrigger>
                  <SelectContent insets={contentInsets} className="">
                    <SelectGroup>
                      <SelectLabel>Professions</SelectLabel>
                      {profession.map((item) => (
                        <SelectItem key={item.value} label={item.label} value={item.value} />
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

          {/* Champ Description */}
          <View className="">
            <Label className="mb-2">Description</Label>
            <Controller
              control={control}
              name="body"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <View>
                  <Textarea
                    placeholder="Description détaillée du service recherché"
                    onChangeText={onChange}
                    value={value}
                    className={clsx('h-24', {
                      'border-destructive': error,
                    })}
                    numberOfLines={4}
                  />
                  {error && (
                    <MotiView
                      from={{ opacity: 0, translateX: -10 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'timing', duration: 200 }}>
                      <Text className="text-destructive mt-1 text-sm">{error.message}</Text>
                    </MotiView>
                  )}
                </View>
              )}
            />
          </View>

          {/* Bouton de soumission */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: 'spring',
              delay: 400,
              damping: 15,
            }}></MotiView>

         
        </CardContent>

        <CardFooter className="w-full flex-col gap-2">
          <View className="w-full flex-row justify-end gap-2">
            <Button
              className="rounded-full"
              variant={'outline'}
              onPress={() => {
                control._reset();
                onClose();
              }}>
              <Text className="font-bold">Fermer</Text>
            </Button>
            {success.status !== 201 && (
              <Button
                className="rounded-full"
                onPress={handleSubmit((data) => {
                  createPost(data);
                })}>
                {isPending ? (
                  <ActivityIndicator />
                ) : (
                  <Text className="text-white">Demander un service</Text>
                )}
              </Button>
            )}
          </View>

          {/* Message de succès/erreur */}
          {success.message && (
            <MotiView
              className="mt-4 mx-auto">
              <Text
                className={clsx('text-center font-bold', {
                  'text-green-600': success.status === 201,
                  'text-destructive':
                    success.status !== null && success.status >= 400 && success.status <= 500,
                })}>
                {success.message}
              </Text>
            </MotiView>
          )}
        </CardFooter>
      </Card>
    </MotiView>
  );
}
export default AddPostCard;
