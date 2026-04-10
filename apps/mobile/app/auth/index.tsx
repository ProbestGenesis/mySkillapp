import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { signInForm } from '@/lib/zodSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { signIn, useSession } from '@/lib/auth-client';


type FormSchema = z.infer<typeof signInForm>;
type Props = {};
function index({}: Props) {
  const { data: session } = useSession();
  console.log(session)
  const { role } = useLocalSearchParams();

  const queryClient = useQueryClient();
  const router = useRouter();

  const [isSuccess, setIsSuccess] = useState<{
    type: string;
    message: string | undefined;
    status: number | null;
    error: boolean;
  }>({ type: '', message: '', status: null, error: false });
  const [isLoading, setIsLoading] = useState(false);
  const clearSuccessState = () => {
    setIsSuccess({ type: '', message: '', status: null, error: false });
  };
  const { handleSubmit, control } = useForm({
    resolver: zodResolver(signInForm),
  });

  const onSubmit = async (data: FormSchema) => {
    setIsLoading(true);
    const { error } = await signIn.phoneNumber({
      phoneNumber: data.phone, // required
      password: data.password, // required
      rememberMe: true,
    });

    if (error?.status === 404) {
      setIsSuccess({
        type: 'signIn',
        message: 'Numéro ou mot de passe incorrect',
        status: error.status,
        error: true,
      });
      setIsLoading(false);
    }

    if(error && error.code === "PHONE_NUMBER_NOT_VERIFIED"){
      router.push(`/auth/verify/phoneNumber?phoneNumber=${data.phone}`)
    }
    if (error && error?.status !== 404) {
      console.log(error);
      setIsSuccess({
        type: 'signIn',
        message: error?.message,
        status: error.status,
        error: true,
      });
      setIsLoading(false);
    }

    if (!error) {
      setIsSuccess({
        type: 'signIn',
        message: 'Vous êtes connectés',
        status: 200,
        error: false,
      });

      setTimeout(() => {
        queryClient.invalidateQueries();
        clearSuccessState();
        router.push('/');
      }, 1500);
    }
  };
  return (
    <SafeAreaView className="h-screen flex-1">
      <ScrollView showsVerticalScrollIndicator={false} className="">
        <KeyboardAvoidingView
          keyboardVerticalOffset={Platform.OS == 'ios' ? 60 : 40}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="h-screen flex-1 flex-col bg-blue-900">
          <View className="flex-1"></View>

          <View className="max-h-[60%] flex-auto flex-col gap-6 rounded-t-3xl bg-white p-2 py-6">
            <View className="flex-col gap-0.5">
              <Text className="text-primary text-left text-3xl font-bold tracking-widest">
                SKILLMAP
              </Text>

              <Text className="text-gray-400">La plateforme idéal pour trouver un prestataire</Text>
            </View>

            <View className="flex-col gap-4.5">
              <Controller
                name="phone"
                control={control}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View className="flex-col gap-0.5">
                    <Label>Numéro de téléphone</Label>
                    <Input
                      className="rounded-lg"
                      onChangeText={onChange}
                      keyboardType="phone-pad"
                      value={value}
                      placeholder="+228"
                    />
                    {error?.message && <Text className="text-destructive">{error.message}</Text>}
                  </View>
                )}
              />
            </View>

            <View className="flex-col gap-1.5">
              <Controller
                name="password"
                control={control}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View className="flex-col gap-0.5">
                    <Label>Mot de passe</Label>
                    <Input
                      className="rounded-lg"
                      onChangeText={onChange}
                      value={value}
                      placeholder="********"
                      secureTextEntry
                    />

                    {error?.message && <Text className="text-destructive">{error.message}</Text>}
                  </View>
                )}
              />
            </View>

            <View>
              <Button disabled={isLoading} onPress={handleSubmit(onSubmit)}>
                {isLoading ? (
                  <ActivityIndicator size={24} color={'white'} />
                ) : (
                  <Text>Se connecter</Text>
                )}
              </Button>
            </View>
            {isSuccess.status && (
              <View className="flex items-center justify-center">
                {' '}
                <Text
                  className={clsx('font-bold', {
                    'text-green-500': !isSuccess.error,
                    'text-destructive': isSuccess.error,
                  })}>
                  {isSuccess.message}
                </Text>
              </View>
            )}

            <View className="my-2 flex-row items-center justify-center text-xs">
              <Text>Vous n'avez pas de compte?</Text>
              <Button variant={'link'} onPress={() => router.push('/auth/register')}>
                <Text>S'incrire</Text>
              </Button>
            </View>
            <View>
              <View className="flex-row items-center justify-center">
                <View></View>
                <Text className="text-muted">OU</Text>
                <View></View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}
export default index;
