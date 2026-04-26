import UserInfo from '@/components/ui/utils/auth/userInfo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useSession, signUp, phoneNumber } from '@/lib/auth-client';
import { registerForm } from '@/lib/zodSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { Image } from 'expo-image';

type FormSchema = z.infer<typeof registerForm>;

function RegisterPage() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();

  // États
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [currentPhone, setCurrentPhone] = useState<string>('');

  const [otpInput, setOtpInput] = useState<string[]>(['', '', '', '']);
  const [statusState, setStatusState] = useState<{
    message: string | undefined;
    type: 'success' | 'error' | '';
  }>({ message: '', type: '' });

  // Refs pour l'auto-focus des inputs OTP
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Timer pour le renvoi du code
  const [timer, setTimer] = useState(0);

  const { handleSubmit, control } = useForm({
    resolver: zodResolver(registerForm),
  });

  // Gestion de la session existante
  useEffect(() => {
    if (session) {
      const user = session.user;
      if (!user.phoneNumberVerified) {
        setCurrentPhone(user.phoneNumber || '');
        sendOtp();
        setStep(2);
      } else if (user.name && /^\d+$/.test(user.name)) {
        // Cas spécifique où le nom est encore des chiffres (pas encore configuré)
        setStep(3);
      }
    }
  }, [pathname]);

  // Décrémentation du timer
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const clearStatus = () => setStatusState({ message: '', type: '' });

  // --- ETAPE 1 : Inscription ---
  const register = async (data: FormSchema) => {
    clearStatus();
    setIsLoading(true);

    await signUp.email(
      {
        email: `${data.phone}@skillmap.com`, // Mieux vaut utiliser un domaine fictif propre ou gérer ça côté back
        name: data.phone,
        password: data.password,
        phoneNumber: data.phone,
      },
      {
        onSuccess: async () => {
          setCurrentPhone(data.phone);
          const { error } = await phoneNumber.sendOtp({
            phoneNumber: data.phone,
          });

          if (error) {
            setStatusState({ message: error.message, type: 'error' });
            setIsLoading(false);
          } else {
            setStatusState({ message: 'Votre compte à été crée avec success!', type: 'success' });
            setTimeout(() => {
              clearStatus();
              setStep(2);
              setTimer(60); // Démarrer le timer
              setIsLoading(false);
            }, 1000);
          }
        },
        onError: (ctx:  any) => {
          setStatusState({
            message: ctx.error.message || 'Une erreur est survenue',
            type: 'error',
          });
          setIsLoading(false);
        },
      }
    );

    setIsLoading(false)
  };

  // --- ETAPE 2 : Gestion OTP ---

  const handleOtpChange = (text: string, idx: number) => {
    const newOtp = [...otpInput];
    newOtp[idx] = text;
    setOtpInput(newOtp);

    if (text && idx < 3) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const sendOtp = async () => {
    clearStatus();
    const phoneToSend = currentPhone || session?.user.phoneNumber;

    if (!phoneToSend) {
      setStatusState({ message: 'Numéro de téléphone introuvable', type: 'error' });
      return;
    }

    const { error } = await phoneNumber.sendOtp({
      phoneNumber: phoneToSend,
    });

    if (error) {
      setStatusState({ message: error.message, type: 'error' });
    } else {
      setStatusState({ message: 'Code renvoyé avec succès', type: 'success' });
      setTimer(60); // Reset timer 60s
    }
  };

  const handleSubmitOtp = async () => {
    const otpCode = otpInput.join('');
    const phoneToVerify = currentPhone || session?.user.phoneNumber;

    if (otpCode.length !== 4) {
      setStatusState({ message: 'Veuillez entrer les 4 chiffres', type: 'error' });
      return;
    }

    if (!phoneToVerify) {
      setStatusState({ message: 'Erreur de session, veuillez vous reconnecter', type: 'error' });
      return;
    }

    setIsLoading(true);
    const { data, error } = await phoneNumber.verify({
      phoneNumber: phoneToVerify,
      code: otpCode,
    });

    setIsLoading(false);

    if (error) {
      setStatusState({ message: error.message || 'Code invalide', type: 'error' });
      return;
    }

    if (data) {
      setStatusState({ message: 'Numéro vérifié !', type: 'success' });
      setTimeout(() => {
        clearStatus();
        setOtpInput(['', '', '', '']);
        setStep(3);
      }, 1000);
    }
  };

  

  return (
    <SafeAreaView className="flex-1 bg-blue-900">
      <ScrollView showsVerticalScrollIndicator={false} className="">
        <KeyboardAvoidingView
          keyboardVerticalOffset={Platform.OS == 'ios' ? 60 : 40}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="h-screen flex-1 flex-col bg-blue-900">
          <View className="flex-1">
            <Image source={require('@/assets/images/splash.png')} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          </View>
          <View className="min-h-[70%] w-full rounded-t-3xl bg-white p-2 pb-10">
            {step === 1 && (
              <View className="gap-6">
                <View>
                  <Text className="text-primary text-left text-3xl font-bold tracking-widest">
                    SKILLMAP
                  </Text>
                  <Text className="mt-1 text-gray-400">
                    La plateforme idéale pour trouver un prestataire
                  </Text>
                </View>

                {/* Formulaire Inscription */}
                <View className="gap-4">
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <View className="gap-1">
                        <Label>Numéro de téléphone</Label>
                        <Input
                          className="rounded-lg"
                          onChangeText={onChange}
                          value={value}
                          placeholder="99785422"
                          keyboardType="phone-pad"
                        />
                        {error && <Text className="text-destructive text-sm">{error.message}</Text>}
                      </View>
                    )}
                  />

                  <Controller
                    name="password"
                    control={control}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <View className="gap-1">
                        <Label>Mot de passe</Label>
                        <Input
                          className="rounded-lg"
                          onChangeText={onChange}
                          value={value}
                          placeholder="********"
                          secureTextEntry
                        />
                        {error && <Text className="text-destructive text-sm">{error.message}</Text>}
                      </View>
                    )}
                  />

                  <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <View className="gap-1">
                        <Label>Confirmer votre mot de passe</Label>
                        <Input
                          className="rounded-lg"
                          onChangeText={onChange}
                          value={value}
                          placeholder="********"
                          secureTextEntry
                        />
                        {error && <Text className="text-destructive text-sm">{error.message}</Text>}
                      </View>
                    )}
                  />
                </View>

                <Button onPress={handleSubmit(register)} disabled={isLoading} className="mt-2">
                  {isLoading ? <ActivityIndicator color="white" /> : <Text>S'inscrire</Text>}
                </Button>

                {statusState.message && (
                  <Text
                    className={clsx(
                      'text-center font-medium',
                      statusState.type === 'error' ? 'text-destructive' : 'text-green-600'
                    )}>
                    {statusState.message}
                  </Text>
                )}

                <View className="flex-row items-center justify-center gap-1">
                  <Text className="text-muted-foreground text-sm">Vous avez déjà un compte?</Text>
                  <Button
                    variant="link"
                    className="h-auto p-0"
                    onPress={() => router.push('/auth')}>
                    <Text className="font-bold">Se connecter</Text>
                  </Button>
                </View>
              </View>
            )}

            {step === 2 && (
              <View className="items-center gap-8 py-8 relative">
                <View className="w-full">
                  <Text className="mb-2 text-center text-2xl font-bold">Vérification</Text>
                  <Text className="text-center text-gray-400">
                    Entrez le code à 4 chiffres envoyé au{" "}
                    <Text className="font-bold text-black">
                      {currentPhone || session?.user.phoneNumber}
                    </Text>
                  </Text>
                </View>

                {/* Inputs OTP Améliorés */}
                <View className="flex-row gap-4">
                  {otpInput.map((digit, idx) => (
                    <Input
                      key={idx}
                      // @ts-ignore - Assignation de ref dynamique
                      ref={(ref) => (inputRefs.current[idx] = ref)}
                      className="h-14 w-14 text-center text-2xl font-bold"
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, idx)}
                      onKeyPress={({ nativeEvent }) => {
                        // Gestion du retour arrière pour reculer le focus
                        if (nativeEvent.key === 'Backspace' && !digit && idx > 0) {
                          inputRefs.current[idx - 1]?.focus();
                        }
                      }}
                    />
                  ))}
                </View>

                <View className="w-full gap-4">
                  <Button className="w-full" onPress={handleSubmitOtp} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="white" /> : <Text>Valider</Text>}
                  </Button>

                  {statusState.message && (
                    <Text
                      className={clsx(
                        'text-center font-medium',
                        statusState.type === 'error' ? 'text-destructive' : 'text-green-600'
                      )}>
                      {statusState.message}
                    </Text>
                  )}
                </View>

                <View className="flex-row items-center gap-2">
                  <Text className="text-muted-foreground text-sm">Code non reçu ?</Text>
                  <Button
                    variant="link"
                    className="h-auto p-0"
                    disabled={timer > 0} // Désactivé SI le timer est > 0
                    onPress={sendOtp}>
                    <Text
                      className={clsx(
                        timer > 0 ? 'text-muted-foreground' : 'text-primary font-bold'
                      )}>
                      {timer > 0 ? `Renvoyer dans ${timer}s` : 'Renvoyer le code'}
                    </Text>
                  </Button>
                </View>

                <Button variant={"outline"}  onPress={() => {
                  setStep(3)
                }}>
                    <Text>Continuer sans vérification</Text>
                </Button>
              </View>
            )}

            {step === 3 && <UserInfo forAuth={true} closeDrawer={() => {}} />}
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

export default RegisterPage;