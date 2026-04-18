import { View, Text, ActivityIndicator } from 'react-native';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import clsx from 'clsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/provider/appProvider';
import { Alert } from 'react-native';

type Props = {};
function ProfilPicture({}: Props) {
  const { data: session } = authClient.useSession();
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
      await authClient.updateUser({
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
          {profilMutation.isPending ? <ActivityIndicator size={24} color={"white"} />  : <Text className="text-lg font-bold text-white"> Continuer</Text>}
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
