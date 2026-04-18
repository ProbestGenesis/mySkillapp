import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { authClient } from '@/lib/auth-client';
import { createSerciveDemand } from '@/lib/zodSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useTRPC } from '@/provider/appProvider';


type Props = {};

function Contact({}: Props) {
  const { data: session } = authClient.useSession();
  const trpc = useTRPC()
  const queryClient = useQueryClient();
  const router = useRouter();
  const {  providerId, skillname, price } = useLocalSearchParams();
 
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{
    message: string | undefined;
    status: number | null;
  }>({ message: '', status: null });
  const [error, setError] = useState<{
    message: string;
    status: number | null;
  }>({ message: '', status: 400 });
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const closeDialog = () => {
    setDialogIsOpen(false);
  };

  const openDialog = ({ type }: { type?: string | undefined }) => {
    setDialogIsOpen(true);
  };

  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    }

    getCurrentLocation();
  }, []);

  const { data, isPending } = useQuery({
    ...trpc.providers.getProvider.queryOptions({
      id: providerId as string,
    }),
    enabled: !!providerId,
  })

  const { mutateAsync: contactProvider, isLoading, error } = useMutation({
    ...trpc.providers.contactProvider.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.providers.getProvider.queryOptions({id: providerId as string}))
    }
  })

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(createSerciveDemand),
  });

  const onSubmit = async (data: { description: string; district?: string }) => {
    setLoading(true);
    if (!session) return null;
    const { message, code } = await contactProvider({ providerId: providerId as string, description: data.description})
    if(code === "SUCCESS"){
      setSuccess({ message, status: 200 })
    }else{
      setError({ message, status: 400 })
    }
    control._reset()
  };

  if (!session) {
    router.push('/auth');
  }

  if (isPending) {
    return (
      <View className="h-full items-center justify-center">
        <ActivityIndicator color="orange" size={64} />
      </View>
    );
  }
  return (
    <View className="h-full p-2">
      <View>
        {' '}
        {data ? (
          <View className="relative">
            <ScrollView showsVerticalScrollIndicator={false} className="">
              <View className="flex-col gap-2 pb-30">
                <View className="flex-col gap-1">
                  <View className="flex-row items-center">
                    <Avatar alt="profil picture" className="size-20">
                      <AvatarImage
                        //@ts-ignore
                        source={{ uri: data?.user?.image }}
                      />
                      <AvatarFallback>
                        <Text>{data?.user?.name?.slice(0, 2)}</Text>
                      </AvatarFallback>
                    </Avatar>
                    <View className="ml-3 flex-1">
                      <Text className="text-lg font-bold">{`${data?.user.name}`}</Text>
                      <Text className="text-sm text-gray-500">{data?.profession}</Text>
                    </View>
                    <View className="flex-row items-center me-2">
                      <Text className="mr-1 text-yellow-500">★</Text>
                      <Text className="text-sm font-medium">{data?.rate.toFixed(1)}</Text>
                    </View>
                  </View>
                  
                  <View className='items-center w-full'>
                    <Text className=' text-gray-800 text-sm'>Bio</Text>
                    <Text className="text-sm max-auto w-fit text-center">{data?.bio}</Text>
                  </View>

                  {/*  <View className="mt-2">
                      <View className="flex-row flex-wrap gap-2">
                        {data?.skills.map((item: any, idx: number) => (
                          <Badge key={item.id}>
                            <Text className="text-xs text-white">
                              {item.title}
                            </Text>
                          </Badge>
                        ))}
                      </View>
                    </View>*/}
                </View>

                <View className=" flex-col gap-8">
                   {
                    skillname && (
                      <View className="flex-col gap-2">
                    <View className="flex-row flex-wrap items-center gap-0.5">
                      <Text className="text-muted-foreground text-xl font-bold">Travaux recherché: {skillname}</Text>
                    </View>

                    <Text className="text-lg">
                      Prix de base: {price} fcfa
                    </Text>
                  </View>
                    )
                   } 

                  <Separator />

                  <View className="flex-col gap-4">
                    <Controller
                      name="description"
                      control={control}
                      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                        <View className="flex-col gap-2">
                          <Label className="flex-row">
                            <Text className="text-xl tracking-tight">Décrivez vos besoins</Text>
                            <Text className="text-destructive text-xl">*</Text>
                          </Label>

                          <Textarea
                            value={value}
                            onChangeText={onChange}
                            placeholder="Écrivez une courte description de vos besoins"
                            className="min-h-[200px]"
                            onBlur={onBlur}
                          />

                          {error && <Text className="text-destructive">{error.message}</Text>}
                        </View>
                      )}
                    />

                    <Controller
                      control={control}
                      name="district"
                      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                        <View className="flex-col gap-2">
                          <Label>
                            <Text className="text-xl tracking-tight">Votre quartier</Text>
                          </Label>
                          <Input
                            placeholder="Ex: Be-kpota"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                          />
                          {error && <Text className="text-destructive">{error.message}</Text>}
                        </View>
                      )}
                    />
                  </View>

                  <Separator />
                  <View>
                    <Text className="text-muted">
                      Lorem ipsum dolor sit amet consectetur adipisicing elit. Dicta dolores quam,
                      ullam facilis sint earum a harum error aperiam! Debitis, quisquam. Repudiandae
                      ut nihil modi consequatur sequi, animi eaque facilis? Lorem ipsum dolor sit
                      amet consectetur adipisicing elit. Vel eius, animi a libero totam illo
                      mollitia maiores magnam. Minus odio sint distinctio consequatur repellat
                      expedita eum ipsa optio molestias consequuntur.
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className="absolute bottom-2 w-full">
              <View className="">
                <View className="flex-row items-center justify-end gap-2">
                  <Button size={'lg'} className="rounded-full" variant={'outline'}>
                    <Text className="text-lg font-bold">Reserver</Text>
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size={'lg'} className="rounded-full">
                        <Text className="text-lg font-bold text-white">Faire appelle à lui</Text>
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader className="w-full">
                        {!success.status ? (
                          <DialogTitle className="text-primary font-bold">
                            <Text>Traitement de la demande</Text>
                          </DialogTitle>
                        ) : (
                          <DialogTitle className="text-primary font-bold">
                            <Text>{`Faire appelle à  ${data?.user.name}`} </Text>
                          </DialogTitle>
                        )}

                        {!success.status ? (
                          <DialogDescription>
                            <Text className="text-lg leading-tight tracking-widest">
                              Votre localisation actuelle sera envoyé au prestataire de service
                            </Text>
                          </DialogDescription>
                        ) : (
                          <View>
                            {success.status === 201 ? (
                              <DialogDescription className="w-full flex-col items-center justify-center">
                                <View className="w-full flex-col items-center justify-center">
                                  <Check stroke={'green'} strokeWidth={2.5} size={64} />
                                  <Text className="text-lg text-green-600">
                                    Vos demandes a été envoyé
                                  </Text>
                                </View>
                              </DialogDescription>
                            ) : (
                              <DialogDescription className="w-full flex-col items-center justify-center">
                                <View className="w-full flex-col items-center justify-center">
                                  <XCircle stroke={'red'} strokeWidth={2.5} size={64} />
                                  <Text className="text-lg text-red-600">
                                    Une erreur s'est produite, réesayer{' '}
                                  </Text>
                                </View>
                              </DialogDescription>
                            )}
                          </View>
                        )}
                      </DialogHeader>

                      <DialogFooter>
                        {!success.status ? (
                          <View className="flex-row items-end justify-end gap-2">
                            <DialogClose asChild>
                              <Button className="rounded-full" variant="ghost">
                                <Text>Annuler</Text>
                              </Button>
                            </DialogClose>

                            <Button
                              className="rounded-full"
                              disabled={loading}
                              onPress={handleSubmit(onSubmit)}>
                              { loading? <ActivityIndicator color="white" size={24} />  : <Text className="font-bold text-white">Continue</Text>}
                            </Button>
                          </View>
                        ) : (
                          <View className="w-full">
                            {success.status === 201 ? (
                              <View className="flex-rox items-end justify-end">
                                {' '}
                                <DialogClose asChild>
                                  <Link asChild href="/(tabs)/services">
                                    <Button className="rounded-full">
                                      <Text className="font-bold text-white">fermer</Text>
                                    </Button>
                                  </Link>
                                </DialogClose>{' '}
                              </View>
                            ) : (
                              <View>
                                <DialogClose asChild>
                                  <Button className="rounded-full" variant={'destructive'}>
                                    <Text className="font-bold text-white">fermer</Text>
                                  </Button>
                                </DialogClose>
                              </View>
                            )}
                          </View>
                        )}
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View className="h-full flex-1 items-center justify-center">
            {' '}
            <Text className="text-destructive text-xl font-bold"> {error.message} </Text>{' '}
          </View>
        )}
      </View>
    </View>
  );
}
export default Contact;
