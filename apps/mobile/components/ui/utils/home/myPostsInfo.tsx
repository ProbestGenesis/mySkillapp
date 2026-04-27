import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { authClient } from '@/lib/auth-client';
import { useTRPC } from '@/provider/appProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import clsx from 'clsx';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Avatar, AvatarFallback, AvatarImage } from '../../avatar';
import { Button } from '../../button';
import { useEffect } from 'react';

function MyPostInfo({ children, postId }: { children: React.ReactNode; postId: string }) {
  const { data: session } = authClient.useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState<{ status: number | null; message: string | null }>({
    status: null,
    message: null,
  });
  const { data: userPost, isLoading } = useQuery({
    ...trpc.post.getMyPost.queryOptions({ postId: postId }),
    enabled: !!session,
  });

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const { mutateAsync: selectedProviderMutation, isPending, error } = useMutation({
    ...trpc.post.selectProvider.mutationOptions(),
    onSuccess: () => {
      setSuccess({ status: 200, message: 'Prestataire selectionné avec succès' });
      queryClient.invalidateQueries(trpc.post.getMyPost.queryOptions({ postId: postId }));
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        setSuccess({ status: 500, message: err.message });
      } else {
        setSuccess({ status: 400, message: 'Prestataire non selectionné' });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', 'getMyPost'] });
    },
  });

  useEffect(() => {
    if (error instanceof TRPCClientError) {
      setSuccess({ status: 500, message: error.message });
    } else if (error) {
      setSuccess({ status: 400, message: 'Prestataire non selectionné' });
    }

   
    setSuccess({ status: 200, message: 'Prestataire selectionné avec succès' });

  }, [error])
  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className=" rounded-2xl">
        {isLoading ? (
          <View className="flex-row items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : (
          <>
            <DialogHeader className="flex-row justify-between">
              <DialogTitle>Ma demande</DialogTitle>
              <View className="flex-row items-center gap-2">
                <Text className="text-muted-foreground text-xs">
                
                  Publier le: {new Date(userPost?.createdAt as string).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                  })}
                </Text>
              </View>
            </DialogHeader>
            <View>
              <Text className="text-lg">{userPost?.body}</Text>

              {userPost?.providerId !== null ? (
                <View className="mx-auto">
                  <Text className="text-accent text-lg text-center">
                    Vous avez déjà selectionner un prestataires
                  </Text>
                </View>
              ) : (
                <View className="mt-4.5 max-h-[300px] overflow-y-scroll">
                  <Text className="mb-2 text-lg font-bold">Personne ayant postuler</Text>

                  {userPost && userPost?.applyProviders?.length > 0 ? (
                    <>
                      {userPost &&
                        userPost?.applyProviders.map((item: any, idx: number) => (
                          <Pressable
                            key={item.id}
                            style={{
                              backgroundColor: selectedProvider === item.id ? '#e5e7eb' : '#fff',
                            }}
                            onPress={() => {
                              setSelectedProvider(item.id);
                            }}
                            className="w-full flex-row gap-2 rounded-lg px-0.5 py-2">
                            <Avatar alt="provider profil picture">
                              <AvatarImage src={item?.user?.image} />
                              <AvatarFallback>
                                <Text className="text-lg">
                                  {' '}
                                  {item?.user?.name.slice(0, 2).toUpperCase()}
                                </Text>
                              </AvatarFallback>
                            </Avatar>
                            <View className="flex flex-col">
                              <Text>{`${item?.user?.name} (${item?.profession})`}</Text>
                              <Text>Prix proposé : {userPost?.offered_Price[idx]} fcfa</Text>
                            </View>
                          </Pressable>
                        ))}
                    </>
                  ) : (
                    <Text className="bg-muted mt-2 rounded-lg p-2 text-center">
                      Personne n'a postuler
                    </Text>
                  )}
                </View>
              )}
            </View>
          </>
        )}
        <DialogFooter className="flex-col gap-2">
          <View className="flex-row items-center justify-end gap-2">
            <DialogClose asChild>
              <Button className="rounded-full" variant={'outline'}>
                <Text>Fermer</Text>
              </Button>
            </DialogClose>

            {userPost?.providerId == null && (
              <Button
                className="rounded-full"
                disabled={!selectedProvider || isPending}
                onPress={() =>
                  selectedProviderMutation({ postId: postId, providerId: selectedProvider! })
                }>
                {isPending ? <ActivityIndicator /> : <Text className="text-white">Accepter</Text>}
              </Button>
            )}
          </View>

          {success.message && (
            <View
              className={clsx(
                'text-center',
                success.status !== null && success.status === 200
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

export default MyPostInfo;
