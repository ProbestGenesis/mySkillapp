import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTRPC } from '@/provider/appProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useRouter } from 'expo-router';
import {
  BriefcaseBusiness,
  Calendar,
  HandCoins,
  MapPin,
  MessageCircleQuestion,
  Phone,
  Star,
} from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '@/components/ui/dialog';
import { useLocalSearchParams } from 'expo-router';

type Props = {};

function Profil({}: Props) {
  const queryClient = useQueryClient();
  const { providerId } = useLocalSearchParams();
  const router = useRouter();
  const trpc = useTRPC();
  const { data, isLoading, isPending } = useQuery({
    ...trpc.providers.getProvider.queryOptions({ id: providerId as string }),
    enabled: !!providerId,
  });

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View className="flex-1 flex-col gap-6 px-2 pb-6">
        <View className="">
          <View className="flex gap-2 py-4">
            {/* <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <Text>
                  {" "}
                  <UserIcon />{" "}
                </Text>
                <Text className="text-lg font-bold">Page de profil </Text>
              </View>
            </View>
*/}
            <View className="flex-row gap-2">
              <Avatar alt="user profil" className="h-24 w-24">
                <AvatarImage
                  //@ts-ignore
                  source={{ uri: data?.user?.image }}
                />
                <AvatarFallback>
                  <Text>Bn </Text>
                </AvatarFallback>
              </Avatar>
              <View className="flex-col gap-0.5">
                <Text className="text-xl font-bold">{data?.user?.name}</Text>

                {isPending ? (
                  <View className="flex-col gap-1">
                    <Skeleton className="h-4 w-40 rounded-full" />
                    <Skeleton className="h-4 w-40 rounded-full" />
                  </View>
                ) : (
                  <View className="flex-col gap-1">
                    {' '}
                    <Text className="text-primary">
                      {data?.profession || 'Profession non renseignée'}
                    </Text>
                    {data && (
                      <Badge variant="secondary">
                        <View className="flex-row gap-2">
                          <Star fill="yellow" stroke={'yellow'} size="18" />
                          <Text
                            className={clsx({
                              'text-green-600': data?.rate > 3,
                              'text-red-700': data?.rate < 3,
                            })}>
                            {data.rate}
                          </Text>
                        </View>
                      </Badge>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : (
          <Card>
            <CardHeader className="">
              <CardTitle className="font-bold">
                <Text>Informations sur le prestataire</Text>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <View className="flex-col gap-2">
                <View className="flex-col items-center justify-center">
                  <Text className="font-bold tracking-widest">Bio</Text>
                  {data?.bio ? (
                    <Text className="text-center text-sm leading-snug">{data?.bio}</Text>
                  ) : (
                    <Text className="text-muted">non renseignée</Text>
                  )}
                </View>

                <View className="flex-row items-center justify-start gap-2">
                  <MapPin />

                  <View className="flex-row gap-1">
                    <Text>Ville et quartier: </Text>
                    {data?.user?.city || data?.user?.district ? (
                      <View className="flex-row gap-1">
                        {' '}
                        <Text>{data?.user?.city} </Text>
                        <Text>|</Text>
                        <Text> {data?.user?.district}</Text>{' '}
                      </View>
                    ) : (
                      <Text className="text-muted">non renseignée</Text>
                    )}
                  </View>
                </View>

                <View className="flex-row items-center justify-start gap-2">
                  <Phone />

                  <View className="flex-row gap-1">
                    <Text>Numéro de télephone: </Text>

                    {data?.user?.phoneNumber ? (
                      <Text>{data?.user?.phoneNumber}</Text>
                    ) : (
                      <Text className="text-muted">non renseignée</Text>
                    )}
                  </View>
                </View>

                <View className="flex-row items-center justify-start gap-2">
                  <BriefcaseBusiness />

                  <View className="flex-row gap-1">
                    <Text>Profession: </Text>

                    {data?.profession ? (
                      <Text>{data?.profession}</Text>
                    ) : (
                      <Text className="text-muted">non renseignée</Text>
                    )}
                  </View>
                </View>

                <View className="flex-row items-center justify-start gap-2">
                  <Calendar />

                  <View className="flex-row gap-1">
                    <Text>Disponibilité: </Text>

                    {data?.availability ? (
                      <Text>{data?.availability}</Text>
                    ) : (
                      <Text className="text-muted">non renseignée</Text>
                    )}
                  </View>
                </View>

                <View className="flex-row items-center justify-start gap-2">
                  <HandCoins />

                  <View className="flex-row gap-1">
                    <Text>Prix de base: </Text>

                    {data?.average_price ? (
                      <Text>{data?.average_price}</Text>
                    ) : (
                      <Text className="text-muted">non renseignée</Text>
                    )}

                    <MessageCircleQuestion />
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {data?.skills && data?.skills.length > 0 && (
          <View className="mt-2 flex-col gap-2">
            <View>
              <Text className="text-3xl font-bold">Services</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {data?.skills.map((item: any, idx: number) => (
                <Badge key={item.id}>
                  <Pressable
                    onPress={() => {
                      router.push({
                        pathname: "/settings/skills",
                        params: {
                          providerId: data.id,
                          skillId: item.id,
                        },
                      });
                    }}>
                    <Text className="text-xs text-white">{item.title}</Text>
                  </Pressable>
                </Badge>
              ))}
            </View>
          </View>
        )}

        <View className="mt-4 w-full flex-row">
          <Dialog className="w-full">
            <DialogTrigger asChild className="w-full">
              <Button className="w-full rounded-full">
                <Text className="text-white">Conctacter </Text>
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader></DialogHeader>
            </DialogContent>
          </Dialog>
        </View>
      </View>
    </ScrollView>
  );
}
export default Profil;
