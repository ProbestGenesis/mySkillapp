import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { changeEmail, updateUser, useSession } from '@/lib/auth-client';
import { personalDataForm } from '@/lib/zodSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, View } from 'react-native';
import { promise, z } from 'zod';

type Props = {
  forAuth: boolean;
  closeDrawer: () => void;
};
function UserInfo({ closeDrawer, forAuth }: Props) {
  const { data: session } = useSession();

  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState<{
    message: string | undefined;
    status: number | null;
    error: boolean | false;
  }>({ message: '', status: null, error: false });
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(personalDataForm),
  });

  const onSubmit = async (data: z.infer<typeof personalDataForm>) => {
    console.log(data);
    setIsLoading(true);


    Promise.allSettled([
      updateUser({
        name: data.name,
      }),
      changeEmail({
        newEmail: data.email ?? session?.user.email as string,
      }),
    ]).then((results) => {
      results.forEach((result) => {
        if (result.status === 'rejected') {
          setIsSuccess({
            message: result.reason.message,
            status: parseInt(result.reason.code ?? '0', 10),
            error: true,
          });
        }
      });

      setIsSuccess({
        message: 'Vos informations ont été mise à jour',
        status: 201,
        error: false,
      });
    })
    .catch(error =>{
       setIsSuccess({
            message: error?.message,
            status: parseInt(error?.code ?? '0', 10),
            error: true,
          });
    })
    .finally(() => {
      setIsLoading(false);
      if (!forAuth) {
        closeDrawer();
      } else {
        router.push('/');
      }
    })}

  useEffect(() => {
    if (pathname.includes('/auth')) {
      closeDrawer();
    }
  }, []);
  return (
    <View className="gap-6 px-2">
      <View className="flex-col gap-2">
        <Text className="text-left text-2xl font-bold">Completez vos informations</Text>
     {forAuth  ?   <Text className="text-gray-400">Nous avons besoin de connaitre votre nom pour vous offrir le meilleur des services</Text>   :   <Text className="text-gray-400">Votre nom semble encore temporaire. Merci de renseigner un vrai nom.</Text>}
      </View>
      <View className="gap-1.5">
        <Label className="font-bold">Votre nom</Label>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <View>
              <Input
                id="name"
                placeholder="Victor Kolma"
                returnKeyType="next"
                submitBehavior="submit"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {error && <Text className="text-destructive">{error.message}</Text>}
            </View>
          )}
        />
      </View>
      <View className="gap-1.5">
        <Label className="font-bold">Votre email(optionel)</Label>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <View>
              <Input
                id="email"
                placeholder="m@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                returnKeyType="next"
                submitBehavior="submit"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {error && <Text className="text-destructive">{error.message}</Text>}
            </View>
          )}
        />
      </View>

      <Button className="w-full rounded-full" disabled={isLoading} onPress={handleSubmit(onSubmit)}>
        {isLoading ? <ActivityIndicator size={24} color={'white'} /> : <Text>Valider</Text>}
      </Button>

      {isSuccess.status && (
        <View className="flex-row items-center justify-center">
          <Text
            className={clsx('font-bold', {
              'text-green-500': !isSuccess.error,
              'text-destructive': isSuccess.error,
            })}>
            {isSuccess.message}
          </Text>
        </View>
      )}
    </View>
  );
}
export default UserInfo;
