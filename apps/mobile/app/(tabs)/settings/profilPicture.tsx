import { View, Text, ActivityIndicator } from 'react-native';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import clsx from 'clsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type Props = {};
function ProfilPicture({}: Props) {
  const { data: session } = authClient.useSession();
  const authToken = authClient.useSession().data?.token;
  const queryClient = useQueryClient();
  const router = useRouter();
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<{
    message: string | undefined;
    status: number | null;
  }>({ message: '', status: null });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
      console.log(result.assets[0]);
    }
  };

  const uploadImage = async () => {
    if (!image?.uri) return;
    setUploading(true);

    const formData = new FormData();

    const file = {
      uri: image.uri,
      type: image.mimeType || 'image/jpeg', 
      name: image.fileName || 'image.jpg',
    };
    //@ts-ignore
    formData.append('file', file);
    formData.append('fileName', file.name);

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SERVER_URL}/pictureProfilUpdate`,
      {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      }
    );
    
    const { message, status } = await response.json();
    console.log(message);
    setSuccess({ message, status });
    setUploading(false);
    setTimeout(() => {
      router.back();
    }, 1000);
  };

  const profilMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: () => {
      (queryClient.invalidateQueries({
        queryKey: ['userProviderInfo'],
      }),
        queryClient.invalidateQueries({
          queryKey: ['bestProvider'],
        }));
    },
  });

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
          onPress={() => profilMutation.mutate()}
          disabled={uploading}>
          {uploading ? <ActivityIndicator size={24} color={"white"} />  : <Text className="text-lg font-bold text-white"> Continuer</Text>}
        </Button>
      </View>

      <View className="mt-12">
        <Text
          className={clsx('font-bold', {
            'text-destructive': success.status !== 200,
            'text-green-600': success.status === 200,
          })}>
          {success.message}
        </Text>
      </View>
    </View>
  );
}
export default ProfilPicture;
