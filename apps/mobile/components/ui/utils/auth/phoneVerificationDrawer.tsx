import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { phoneNumber } from '@/lib/auth-client';
import clsx from 'clsx';
import { useRouter } from 'expo-router';
import { AnimatePresence, MotiView } from 'moti';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  phone?: string | null;
  onVerified: () => void;
  onClose: () => void;
  isCriticalMode?: boolean;
};

function PhoneVerificationDrawer({
  visible,
  phone,
  onVerified,
  onClose,
  isCriticalMode = false,
}: Props) {
  const router = useRouter();
  const [otpInput, setOtpInput] = useState<string[]>(['', '', '', '']);
  const [statusState, setStatusState] = useState<{
    message: string | undefined;
    type: 'success' | 'error' | '';
  }>({ message: '', type: '' });
  const [timer, setTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSentForSession, setOtpSentForSession] = useState(false);

  const insets = useSafeAreaInsets();
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const clearStatus = () => setStatusState({ message: '', type: '' });

  const sendOtp = async () => {
    if (!phone) {
      setStatusState({ message: 'Numero de telephone introuvable.', type: 'error' });
      return;
    }

    clearStatus();
    const { error } = await phoneNumber.sendOtp({
      phoneNumber: phone,
    });

    if (error) {
      setStatusState({ message: error.message, type: 'error' });
      return;
    }

    setStatusState({ message: 'Code envoye avec succes.', type: 'success' });
    setTimer(60);
  };

  const handleOtpChange = (text: string, idx: number) => {
    const sanitized = text.replace(/\D/g, '');
    const newOtp = [...otpInput];
    newOtp[idx] = sanitized;
    setOtpInput(newOtp);

    if (sanitized && idx < 3) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otpInput.join('');

    if (!phone) {
      setStatusState({ message: 'Numero de telephone introuvable.', type: 'error' });
      return;
    }

    if (otpCode.length !== 4) {
      setStatusState({ message: 'Veuillez entrer les 4 chiffres.', type: 'error' });
      return;
    }

    setIsLoading(true);
    const { error } = await phoneNumber.verify({
      phoneNumber: phone,
      code: otpCode,
    });
    setIsLoading(false);

    if (error) {
      setStatusState({ message: error.message || 'Code invalide.', type: 'error' });
      return;
    }

    setStatusState({ message: 'Numero verifie avec succes.', type: 'success' });
    setTimeout(() => {
      setOtpInput(['', '', '', '']);
      clearStatus();
      onVerified();
      router.push('/');
    }, 1500);
  };

  useEffect(() => {
    if (!visible) {
      setOtpSentForSession(false);
      setOtpInput(['', '', '', '']);
      clearStatus();
      setTimer(0);
      return;
    }

    if (!otpSentForSession && phone) {
      setOtpSentForSession(true);
      void sendOtp();
    }
  }, [visible, phone, otpSentForSession]);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + 20}>
      <AnimatePresence>
        {visible && (
          <View className="absolute inset-0 z-50 justify-end">
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 180 }}
              className="absolute inset-0 bg-black/40">
              <Pressable className="h-full w-full" disabled={isCriticalMode} onPress={onClose} />
            </MotiView>

            <MotiView
              from={{ translateY: 420, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              exit={{ translateY: 420, opacity: 0 }}
              transition={{ type: 'timing', duration: 260 }}
              className="max-h-[85%] w-full rounded-t-3xl bg-white px-4 pt-5 pb-8">
              <View className="items-center gap-2">
                <View className="h-1.5 w-14 rounded-full bg-gray-300" />
                <Text className="text-center text-2xl font-bold">Confirmer votre numero</Text>
                <Text className="text-center text-sm text-gray-500">
                  Entrez le code OTP a 4 chiffres envoye au {phone || 'numero indisponible'}.
                </Text>
              </View>

              <View className="mt-7 items-center gap-4">
                <View className="flex-row gap-4">
                  {otpInput.map((digit, idx) => (
                    <Input
                      key={`otp-${idx}`}
                      // @ts-ignore - Assignation de ref dynamique
                      ref={(ref) => (inputRefs.current[idx] = ref)}
                      className="h-14 w-14 text-center text-2xl font-bold"
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, idx)}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace' && !digit && idx > 0) {
                          inputRefs.current[idx - 1]?.focus();
                        }
                      }}
                    />
                  ))}
                </View>

                {statusState.message ? (
                  <Text
                    className={clsx(
                      'text-center font-medium',
                      statusState.type === 'error' ? 'text-destructive' : 'text-green-600'
                    )}>
                    {statusState.message}
                  </Text>
                ) : null}
              </View>

              <View className="mt-7 gap-3">
                <Button disabled={isLoading} onPress={handleVerify} className="w-full">
                  {isLoading ? <ActivityIndicator color="white" /> : <Text>Valider le code</Text>}
                </Button>

                <Button variant="outline" onPress={sendOtp} disabled={timer > 0}>
                  <Text className={timer > 0 ? 'text-muted-foreground' : ''}>
                    {timer > 0 ? `Renvoyer dans ${timer}s` : 'Renvoyer le code'}
                  </Text>
                </Button>

                {!isCriticalMode ? (
                  <Button
                    variant="ghost"
                    onPress={() => {
                      router.push('/');
                    }}>
                    <Text>Plus tard</Text>
                  </Button>
                ) : null}
              </View>
            </MotiView>
          </View>
        )}
      </AnimatePresence>
    </KeyboardAvoidingView>
  );
}

export default PhoneVerificationDrawer;
