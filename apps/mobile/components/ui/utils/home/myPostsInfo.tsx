import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { authClient } from '@/lib/auth-client';
import { useTRPC } from '@/provider/appProvider';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

function MyPostInfo({ children, postId }: { children: React.ReactNode; postId: string }) {
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const { data: userPost, isLoading } = useQuery({
    ...trpc.post.getMyPost.queryOptions({ postId: postId }),
    enabled: !!session,
  });
  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent>
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
                  Publier le: {userPost?.createdAt.toString()}
                </Text>
              </View>
            </DialogHeader>
            <View>
              <Text className="text-lg">{userPost?.body}</Text>

              <View className="max-h-[300px] overflow-y-scroll mt-4.5">
                <Text>Personne ayant postuler</Text>

                {userPost && userPost?.applyProviders?.length > 0 ? (
                  <>
                    {userPost &&
                      userPost?.applyProviders.map((provider: any, idx: number) => (
                        <Pressable key={provider.id}>
                          <Text>{provider?.name}</Text>
                          <Text>{userPost?.offered_Price[idx]}</Text>
                        </Pressable>
                      ))}
                  </>
                ) : (
                  <Text className='text-center p-2 rounded-lg bg-muted mt-2'>Personne n'a postuler</Text>
                )}
              </View>
            </View>
          </>
        )}
        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MyPostInfo;
