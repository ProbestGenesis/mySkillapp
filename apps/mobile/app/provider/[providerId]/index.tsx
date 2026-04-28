import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTRPC } from '@/provider/appProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import {
  BriefcaseBusiness,
  Calendar,
  CircleQuestionMark,
  HandCoins,
  MapPin,
  Phone,
  Star,
} from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
                      <View className="flex-row items-center gap-1.5">
                        <View className="flex-row items-center gap-0.5">
                          <Text className="text-xs">{data.rate}</Text>
                          <Star size={12} color="#FFD700" />
                        </View>
                        <Text className="text-xs">{data.mission_nb} missions</Text>
                      </View>
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

                  <View className="flex-row items-center gap-1">
                    <Text>Prix de base(FCFA): </Text>

                    {data?.average_price ? (
                      <Text>{data?.average_price}</Text>
                    ) : (
                      <Text className="text-muted">non renseignée</Text>
                    )}
                  </View>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button className="w-8 rounded-full" variant="ghost" size={'icon'}>
                        <CircleQuestionMark color="#898989" />
                      </Button>
                    </TooltipTrigger>

                    <TooltipContent className="max-w-2xs">
                      <Text className="text-muted text-xs">
                        C'est le prix en dessous du quel le prestataire ne souhaite pas être
                        contacté.
                      </Text>
                    </TooltipContent>
                  </Tooltip>
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
                <Link
                  key={item.id}
                  href={{
                    pathname: '/provider/[providerId]/contact',
                    params: {
                      providerId: data.id,
                      skillId: item.id,
                    },
                  }}
                  asChild>
                  <Badge>
                    <Text className="text-xs text-white">{item.title}</Text>
                  </Badge>
                </Link>
              ))}
            </View>
          </View>
        )}

        {!isLoading && data && (
          <View className="mt-4 w-full flex-row">
            <Link
              asChild
              href={{
                pathname: '/provider/[providerId]/contact',
                params: {
                  providerId: data?.id as string,
                },
              }}>
              <Button className="w-full rounded-full">
                <Text className="text-white">Contacter </Text>
              </Button>
            </Link>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
export default Profil;
