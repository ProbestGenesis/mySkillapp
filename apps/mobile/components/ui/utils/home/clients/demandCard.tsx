import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { useTRPC } from '@/provider/appProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import clsx from 'clsx';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import z from 'zod';
import { useQueryClient } from '@tanstack/react-query';

type Props = {
  showDemandCard: boolean;
  onClose: () => void;
  clientIds: { demandId: string; id: string };
};

export default function DemandCard({ showDemandCard, onClose, clientIds }: Props) {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const postId = clientIds.demandId;
  const [success, setSuccess] = useState<{ status: Number | null; message: string }>({
    status: null,
    message: '',
  });

  const applySchema = z.object({
    offeredPrice: z.number().nonoptional('Veuillez saisir un prix'),
  });

  const { handleSubmit, control } = useForm<z.infer<typeof applySchema>>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      offeredPrice: 500,
    },
  });
  const { data: post, isLoading } = useQuery({
    ...trpc.post.getPost.queryOptions({ id: postId }),
    enabled: showDemandCard && !!postId,
  });
  const clearMessage = () => {
    setSuccess({
      message: '',
      status: null,
    });
  };

  const {
    mutateAsync: applyForPost,
    isPending,
    error,
  } = useMutation({
    ...trpc.post.applyForPost.mutationOptions(),
    onSuccess: () => {
      setSuccess({
        message: 'Vous avez postuler avec succès',
        status: 201,
      });

      setTimeout(() => {
        clearMessage();
        queryClient.invalidateQueries({
          ...trpc.post.getPost.queryOptions({ id: postId }),
        });
        onClose();
      }, 1000);
    },
    onError: () => {
      if (error instanceof TRPCClientError) {
        setSuccess({
          message: error.message,
          status: 500,
        });
        return;
      }

      if (error) {
        setSuccess({
          message: "Une erreur s'est produite",
          status: 500,
        });
        return;
      }
    },
  });

  return (
    <Dialog
      open={showDemandCard}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}>
      <DialogContent className="w-full rounded-2xl">
        {isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator />
            <Text className="text-muted-foreground mt-3 text-sm">Chargement…</Text>
          </View>
        ) : !post ? (
          <Text className="text-muted-foreground text-center">Demande introuvable.</Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center gap-3 pb-4">
              <Avatar alt="client" className="size-14">
                <AvatarImage source={{ uri: post.user?.image ?? undefined }} />
                <AvatarFallback />
              </Avatar>
              <View className="flex-1">
                <Text className="text-lg font-bold">{post.user?.name}</Text>
                <Text className="text-primary text-sm font-medium">{post.profession}</Text>
              </View>
            </View>
            <Text className="text-foreground text-base leading-6">{post.body}</Text>

            {post.applyProviders?.some((item: any) => item.userId === session?.user.id) ? (
              <Text className="text-center text-lg text-green-500">
                Vous avez déjà postuler pour cette demande
              </Text>
            ) : (
              <Controller
                control={control}
                name="offeredPrice"
                render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
                  <View className="mt-4">
                    <Text className="text-foreground mb-2 text-sm font-medium">
                      Proposé un prix
                    </Text>
                    <Input
                      className="border-input bg-background rounded-lg border px-4 text-base"
                      placeholder="Ex: 5000 FCFA"
                      keyboardType="numeric"
                      value={value?.toString()}
                      onChangeText={(text) => onChange(Number(text))}
                    />
                    {error && <Text className="text-red-500">{error.message}</Text>}
                  </View>
                )}
              />
            )}
            <View className="flex-row items-end justify-end gap-2.5">
              <Button className="mt-6 rounded-full" variant="outline" onPress={onClose}>
                <Text>Fermer</Text>
              </Button>

              {!post.applyProviders?.some((item: any) => item.userId === session?.user.id) && (
                <Button
                  className="rounded-full"
                  disabled={isPending}
                  onPress={handleSubmit((data) => {
                    applyForPost({
                      postId: postId,
                      offeredPrice: data.offeredPrice,
                    });
                  })}>
                  {isPending ? (
                    <ActivityIndicator />
                  ) : (
                    <Text className="dark:text-primary-foreground text-white">Postuler</Text>
                  )}
                </Button>
              )}
            </View>
          </ScrollView>
        )}

        <DialogFooter className="mx-auto">
          {success.message && (
            <View
              className={clsx(
                'text-center',
                success.status !== null && success.status === 201
                  ? 'text-green-500'
                  : 'text-red-500'
              )}>
              {success.message}
            </View>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
