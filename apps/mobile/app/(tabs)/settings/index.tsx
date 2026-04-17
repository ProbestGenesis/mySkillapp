import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { authClient } from '@/lib/auth-client';
import { useTRPC } from '@/provider/appProvider';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Link, useRouter } from 'expo-router';
import {
  AlertCircle,
  BriefcaseBusiness,
  Calendar,
  HandCoins,
  LogOut,
  MapPin,
  Phone,
  QrCode,
  ServerIcon,
  Settings,
  Star,
  UserIcon,
} from 'lucide-react-native';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {};

function SettingScreen({}: Props) {
  const { data: session, isPending } = authClient.useSession();
  const trpc = useTRPC();
  const router = useRouter();

  const { data, isLoading, error } = useQuery(
    trpc.user.getUserWithProviderData.queryOptions({ userId: session?.user.id as string })
  );
  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!session) {
      router.replace('/auth');
    }
  }, [session]);
  if (isLoading || isPending) {
    return (
      <SafeAreaView className="h-screen flex-1">
        <View className="h-full w-full flex-row items-center justify-center">
          <ActivityIndicator size={64} color={'orange'} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="h-screen flex-1">
        <View className="h-full w-full flex-row items-center justify-center">
          <AlertCircle size={64} color={'red'} />
          <Text className="text-red-600">Une erreur est survenue</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView className="h-screen flex-1">
        <View className="h-full w-full flex-row items-center justify-center">
          <AlertCircle size={64} color={'red'} />
          <Text className="text-red-600">Impossible de charger vos informations</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-2 pb-20">
          <View className="flex gap-2 py-4">
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text>
                  {' '}
                  <UserIcon />{' '}
                </Text>
                <Text className="text-lg font-bold">Votre profil </Text>
              </View>

              {!data.provider ? (
                <Link asChild href={'/(tabs)/settings/provider'}>
                  <Button size={'sm'} className="rounded-full">
                    <Text className="font-bold text-white">Devenir prestataire </Text>
                  </Button>
                </Link>
              ) : (
                <Button size={'sm'} variant={'outline'} className="rounded-full">
                  <Text className="font-bold">Modifier votre profil</Text>
                </Button>
              )}
            </View>

            <View className="flex-row gap-2">
              <Link href="/(tabs)/settings/profilPicture">
                <Avatar alt="user profil" className="h-20 w-20">
                  <AvatarImage
                    //@ts-ignore
                    source={{ uri: session.user?.image }}
                  />
                  <AvatarFallback>
                    <Text className="text-center">Ajouter une photo</Text>
                  </AvatarFallback>
                </Avatar>
              </Link>
              <View className="flex-col gap-0.5">
                <Text className="text-xl font-bold">{session?.user?.name}</Text>

                {isLoading ? (
                  <View className="flex-col gap-1">
                    <Skeleton className="h-4 w-40 rounded-full" />
                    <Skeleton className="h-4 w-40 rounded-full" />
                  </View>
                ) : (
                  <View className="flex-col gap-1">
                    {' '}
                    <Text className="text-primary">
                      {data?.provider?.profession
                        ? `Profession:   ${data?.provider?.profession}`
                        : 'Profession non renseignée'}
                    </Text>
                    {data?.provider && (
                      <View className="flex-row items-center gap-1.5">
                        {' '}
                        <View className="flex-row items-center gap-0.5">
                          <Text
                            className={clsx({
                              'text-green-600': data?.provider?.rate > 3,
                              'text-red-700': data?.provider?.rate < 3,
                            })}>
                            {data?.provider?.rate}
                          </Text>
                          <Star size={8} />
                        </View>{' '}
                        <Text>-</Text>
                        <View>
                          <Text>{data?.provider?.mission_nb} missions</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>

          <View className="flex-col gap-8">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>
                  <Text className="text-primary">Votre solde: </Text>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-row items-center justify-end gap-2">
                <Button variant={'outline'} className="rounded-full">
                  <Text>Retirer</Text>
                </Button>

                <Button className="rounded-full">
                  <Text className="text-white">Recharger</Text>
                </Button>
              </CardContent>
            </Card>

            {isLoading ? (
              <Skeleton className="h-32 w-full rounded-lg" />
            ) : (
              <Card>
                <CardHeader className="">
                  <CardTitle className="font-bold">
                    <Text>Vos informations</Text>
                  </CardTitle>
                  <CardDescription>
                    <Text>
                      Renseigner vos informations personel renforce la confiance de client a propos
                      de vous
                    </Text>
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <View className="flex-col gap-2">
                    <View className="flex-col items-center justify-center">
                      <Text className="font-bold tracking-widest">Bio</Text>
                      {data?.provider?.bio ? (
                        <Text className="text-center text-sm leading-snug dark:text-gray-50">
                          {data?.provider?.bio}
                        </Text>
                      ) : (
                        <Button variant="link" size="sm">
                          Ajouter un bio
                        </Button>
                      )}
                    </View>

                    <View className="flex-row items-center justify-start gap-2">
                      <MapPin className="dark:text-gray-50" />

                      <View className="flex-row gap-1">
                        <Text className="dark:text-gray-50">Ville et quartier: </Text>
                        {data?.city || data?.district ? (
                          <View className="flex-row gap-1">
                            {' '}
                            <Text className="dark:text-gray-50"> {data?.city} </Text>
                            <Text className="dark:text-gray-50"> |</Text>
                            <Text className="dark:text-gray-50"> {data?.district}</Text>{' '}
                          </View>
                        ) : (
                          <Text className="text-muted">non renseignée</Text>
                        )}
                      </View>
                    </View>

                    <View className="flex-row items-center justify-start gap-2">
                      <Phone className="dark:fill-text-gray-50 dark:text-gray-50" />

                      <View className="flex-row gap-1">
                        <Text className="dark:text-gray-50">Numéro de télephone: </Text>

                        {data?.phoneNumber ? (
                          <Text className="dark:text-gray-50">{data?.phoneNumber}</Text>
                        ) : (
                          <Text className="text-mute">non renseignée</Text>
                        )}
                      </View>
                    </View>

                    <View className="flex-row items-center justify-start gap-2">
                      <BriefcaseBusiness />

                      <View className="flex-row gap-1">
                        <Text className="dark:text-gray-50">Profession: </Text>

                        {data?.provider?.profession ? (
                          <Text>{data?.provider?.profession}</Text>
                        ) : (
                          <Text className="text-muted">non renseignée</Text>
                        )}
                      </View>
                    </View>

                    <View className="flex-row items-center justify-start gap-2">
                      <Calendar />

                      <View className="flex-row gap-1">
                        <Text className="dark:text-gray-50">Disponibilité: </Text>

                        {data?.provider?.availability ? (
                          <Text>{data?.provider?.availability}</Text>
                        ) : (
                          <Text className="text-muted">non renseignée</Text>
                        )}
                      </View>
                    </View>

                    <View className="flex-row items-center justify-start gap-2">
                      <HandCoins />

                      <View className="flex-row gap-1">
                        <Text className="dark:text-gray-50">Prix de base: </Text>

                        {data?.provider?.average_price ? (
                          <Text>{data?.provider?.average_price}</Text>
                        ) : (
                          <Text className="text-muted">non renseignée</Text>
                        )}

                        <Badge variant={'secondary'} className="h-6 w-6">
                          <Text className="text-xs font-bold">!</Text>
                        </Badge>
                      </View>
                    </View>
                  </View>
                </CardContent>

                <CardFooter className="flex-row items-end justify-end">
                  <Button
                    className="rounded-full"
                    onPress={() => {
                      router.push('/(tabs)/settings/editProfil');
                    }}>
                    <Text className="text-white">Modifier</Text>
                  </Button>
                </CardFooter>
              </Card>
            )}

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-primary text-xl font-bold">
                  Confirmation de service terminé
                </CardTitle>

                <CardDescription>
                  <Text>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi et, eveniet atque
                    aliquid molestiae{' '}
                  </Text>
                </CardDescription>
              </CardHeader>

              <CardContent>
                <View className="flex-row items-center gap-4">
                  <KeyboardAvoidingView
                    behavior={Platform.select({
                      ios: 'padding',
                      android: 'height',
                    })}
                    keyboardVerticalOffset={Platform.select({
                      ios: 60,
                      android: 100,
                    })}>
                    {' '}
                    <Input
                      placeholder="Entrer le code"
                      className="w-[120px] rounded-full text-xl" 
                                          />
                  </KeyboardAvoidingView>
                  <Button className="rounded-full" variant={'outline'}>
                    <Text>
                      {' '}
                      <QrCode />{' '}
                    </Text>
                  </Button>
                </View>
              </CardContent>

              <CardFooter className="flex-row items-end justify-end">
                <Button className="rounded-full">
                  <Text className="text-white">Confirmer </Text>
                </Button>
              </CardFooter>
            </Card>

            {isLoading ? (
              <Skeleton className="h-32 w-full rounded-lg" />
            ) : (
              <View>
                {session?.user.role === 'PROVIDER' && data.provider && (
                  <Card>
                    <CardHeader className="flex-row justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text>
                          <ServerIcon />{' '}
                        </Text>
                        <Text className="text-lg font-bold">Vos services</Text>
                      </View>

                      {data.provider && data?.provider?.skills?.length > 0 && (
                        <Link
                          asChild
                          href={{
                            pathname: '/(tabs)/settings/skills',
                            params: { providerId: data?.provider?.id as string },
                          }}>
                          <Button size="sm" className="rounded-full">
                            <Text className="text-white">Ajouter un service</Text>
                          </Button>
                        </Link>
                      )}
                    </CardHeader>

                    <CardContent className="w-full flex-col gap-4">
                      {data?.provider && data?.provider?.skills?.length > 0 ? (
                        <View>
                          {data?.provider?.skills?.map((service: any, idx: number) => {
                            if (idx < 3) {
                              return (
                                <View className="mb-1 flex-col gap-2" key={service.id}>
                                  <View className="flex-row items-center gap-2">
                                    <View className="flex-1 flex-col">
                                      <View className="flex-col gap-1">
                                        <Text className="text-lg font-semibold">
                                          {service.title}
                                        </Text>
                                        <Text className="text-muted">{service.description}</Text>
                                      </View>

                                      <View>
                                        <Text className="text-primary font-semibold -tracking-tighter">
                                          Prix de base: {service.average_price} FCFA
                                        </Text>
                                      </View>
                                    </View>

                                    <Button
                                      className="h-8 w-8 rounded-full"
                                      variant="link"
                                      size={'sm'}>
                                      <Text className="text-xs">Modifier</Text>
                                    </Button>
                                  </View>

                                  <View className="h-0.5 w-full bg-gray-200" />
                                </View>
                              );
                            }
                            return null;
                          })}
                        </View>
                      ) : (
                        <View className="w-full flex-col items-center justify-center gap-6">
                          <Text className="font-bold">
                            Vous n'avez pas encore ajouté les services que vous éffectuez
                          </Text>

                          <Link
                            asChild
                            href={{
                              pathname: '/(tabs)/settings/skills',
                              params: { providerId: data?.provider?.id as string },
                            }}>
                            <Button size={'lg'} className="rounded-full">
                              <Text className="text-white">Ajouter un service</Text>
                            </Button>
                          </Link>
                        </View>
                      )}
                    </CardContent>
                  </Card>
                )}
              </View>
            )}

            <Card>
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <Settings />
                  <Text className="text-lg font-bold">Preference</Text>
                </View>
              </CardHeader>

              <CardContent className="flex-col gap-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-col gap-1">
                    <Text className="text-lg">Activer les notifications</Text>
                    <Text className="text-muted">
                      Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ipsa, magnam
                      laboriosam
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-col gap-1">
                    <Text className="text-lg">Email marketing</Text>
                    <Text className="text-muted">
                      Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ipsa, magnam
                      laboriosam
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Button className="w-full flex-row gap-6" variant={'outline'} onPress={handleSignOut}>
              <LogOut />

              <Text className="font-bold">Se deconncter</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default SettingScreen;
