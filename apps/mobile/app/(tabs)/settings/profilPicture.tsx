import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { authClient, useSession } from '@/lib/auth-client';
import { useTRPC } from '@/provider/appProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {};
function ProfilPicture({}: Props) {
   const { data : session, isPending }= useSession()
  const queryClient = useQueryClient();
  const router = useRouter();
  const trpc = useTRPC();
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [success, setSuccess] = useState<{
    message: string | undefined;
    status: number | null;
  }>({ message: '', status: null });

  const [permissionStatus, requestPermission] = ImagePicker.useMediaLibraryPermissions();

  const pickImage = async () => {
    try {
      // S'assurer que les permissions sont accordées avant d'ouvrir le picker
      if (!permissionStatus?.granted) {
        const permission = await requestPermission();
        if (!permission.granted) {
          Alert.alert(
            'Permission requise',
            "L'accès à la galerie est nécessaire pour changer votre photo de profil."
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
    }
  };

  const profilMutation = useMutation({
    ...trpc.user.updateProfilePicture.mutationOptions(),
    onSuccess: async (data) => {
      const updatedUserRes = await authClient.updateUser({
        image: data.imageUrl,
      });
      setSuccess({ message: data.message, status: 200 });
      queryClient.invalidateQueries({ queryKey: ['userProviderInfo'] });
      setTimeout(() => {
        router.back();
      }, 1000);
    },
    onError: (error) => {
      setSuccess({ message: error.message || "Une erreur s'est produite", status: 500 });
    },
  });

  const handleUpload = () => {
    if (!image?.base64) return;

    profilMutation.mutate({
      base64: image.base64,
      mimeType: image.mimeType || 'image/jpeg',
      fileName: image.fileName || 'image.jpg',
    });
  };

  if (!isPending && !session) {
      return (
        <SafeAreaView className="h-screen flex-1">
          <View className="h-full w-full flex-col items-center justify-center gap-2">
            <Text className="text-accent text-center text-lg">
              {' '}
              Vous devez vous connecter pour acceder a cette page{' '}
            </Text>
            <Button
              className="rounded-full"
              variant={'outline'}
              size={"lg"}
              onPress={() => {
                router.push('/auth');
              }}>
              {' '}
              <Text>Se connecter</Text>{' '}
            </Button>
          </View>
        </SafeAreaView>
      );
    }
  

  return (
    <View className="relative mt-2 h-full flex-col items-center justify-center gap-6 pt-8">
      <View className="flex-col items-center justify-center gap-6">
        <View className="">
          <Text className="text-xl font-bold leading-tight tracking-widest">
            Choisir une photo de profil
          </Text>
        </View>
        <Avatar alt="profil picture" className="h-32 w-32">
          <AvatarImage source={{ uri: image?.uri || '' }} />
          <AvatarFallback>{session?.user.name?.slice(0, 2)}</AvatarFallback>
        </Avatar>

        <Button className="border-2 border-dotted" variant={'outline'} onPress={pickImage}>
          <Text>Selectionner une image</Text>
        </Button>
      </View>

      <View className="mt-12">
        <Button
          className="rounded-full"
          onPress={handleUpload}
          disabled={profilMutation.isPending || !image?.base64}>
          {profilMutation.isPending ? <ActivityIndicator size={24} color={"white"} />  : <Text className="text-lg font-bold text-white">Enregistrer</Text>}
        </Button>
      </View>

      <View className="mt-12">
        <Text
          className={clsx('font-bold', {
            'text-destructive': success.status !== 200 && success.status !== null,
            'text-green-600': success.status === 200,
          })}>
          {success.message}
        </Text>
      </View>
    </View>
  );
}
export default ProfilPicture;
