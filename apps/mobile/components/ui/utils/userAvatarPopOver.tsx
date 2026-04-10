import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut, updateUser, useSession } from '@/lib/auth-client';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, Check, LogOut } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { Button } from '../button';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';

type Props = {};

function UserAvatarPopOver({}: Props) {
  const { data: session } = useSession();
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const username = session?.user.name ?? 'Guest';
  const email = session?.user.email;
  const profilImage = session?.user.image;
  const [pickedImage, setPickedImage] = useState<string | null>(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Permission to access the media library is required.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPickedImage(result.assets[0].uri);
    }
  };

  const uploadImageToSupabase = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const userId = session?.user.id;
      if (!userId) throw new Error('Utilisateur non identifié');

      const fileExt = uri.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('skillmap')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('skillmap').getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      console.error('Erreur upload Supabase:', err);
      setError(err.message || "Échec de l'upload");
      return null;
    }
  };

  const handleUpdateAvatar = async () => {
    if (!pickedImage) return;

    setIsUpdating(true);
    setError('');

    try {
      const publicUrl = await uploadImageToSupabase(pickedImage);

      if (!publicUrl) {
        setIsUpdating(false);
        return;
      }
      const { error: updateError } = await updateUser({
        image: publicUrl,
      });

      if (updateError) {
        setError(updateError.message || 'Erreur de mise à jour');
        setPickedImage(null);

        setTimeout(() => {
          setError('');
        }, 1000);
      } else {
        setPickedImage(null);
      }
    } catch (e: any) {
      setError('Une erreur est survenue');
      setPickedImage(null);
      setTimeout(() => {
        setError('');
      }, 1000);
    } finally {
      setIsUpdating(false);
    }
  };

  const ActionButtons = useMemo(() => {
    if (pickedImage) {
      return (
        <Button
          className="bg-primary rounded-full"
          size="sm"
          onPress={handleUpdateAvatar}
          disabled={isUpdating}>
          {isUpdating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <View className="flex-row items-center gap-2">
              <Check size={16} color="white" />
              <Text className="font-medium text-white">Confirmer</Text>
            </View>
          )}
        </Button>
      );
    }

    if (session) {
      const isCustomer =
        session.user.role?.toLowerCase() === 'customer' ||
        session.user.role?.toLowerCase() === 'user';
      return (
        <View className="flex-col gap-2">
          {isCustomer && (
            <Button className="border-primary/20 rounded-full" size="sm" variant="outline">
              <Text className="text-primary text-xs font-medium">Devenir prestataire</Text>
            </Button>
          )}
          <Button
            className="rounded-full"
            variant="destructive"
            size="sm"
            onPress={async () => {
              await signOut();
              router.push('/auth');
            }}>
            <View className="flex-row items-center gap-2">
              <LogOut size={16} color="white" />
              <Text className="font-medium text-white">Se déconnecter</Text>
            </View>
          </Button>
        </View>
      );
    }

    return (
      <Button className="rounded-full" size="sm" onPress={() => router.push('/auth')}>
        <Text className="font-medium text-white">Se connecter</Text>
      </Button>
    );
  }, [pickedImage, session, isUpdating]);

  return (
    <Popover>
      <PopoverTrigger>
        <Avatar alt={'User Avatar'} className="border-primary/10 size-12 border-2">
          <AvatarImage src={profilImage ?? ''} />
          <AvatarFallback className="bg-primary/5">
            <Text className="text-primary font-bold">{username.slice(0, 1).toUpperCase()}</Text>
          </AvatarFallback>
        </Avatar>
      </PopoverTrigger>

      <PopoverContent className="border-border bg-card w-64 rounded-3xl border p-4 shadow-xl">
        <View className="flex-col gap-4">
          <View className="flex-row items-center gap-3">
            {pickedImage ? (
              <Pressable onPress={pickImage} className="relative">
                <Image className="size-14 rounded-full border" source={{ uri: pickedImage }} />
                <View className="bg-primary border-card absolute right-0 bottom-0 rounded-full border-2 p-1.5">
                  <Camera size={12} color="white" />
                </View>
              </Pressable>
            ) : (
              <Avatar alt={'User Avatar'} className="border-primary/10 size-12 border-2">
                <AvatarImage src={profilImage ?? ""} />
                <AvatarFallback className="bg-primary/5">
                  <Text className="text-primary font-bold">
                    {username.slice(0, 1).toUpperCase()}
                  </Text>
                </AvatarFallback>
              </Avatar>
            )}

            <View className="flex-1">
              <Text className="text-foreground text-lg font-bold" numberOfLines={1}>
                {username}
              </Text>
            </View>
          </View>

          {error ? (
            <Text className="text-destructive px-2 text-center text-[10px]">{error}</Text>
          ) : null}

          {ActionButtons}
        </View>
      </PopoverContent>
    </Popover>
  );
}

export default UserAvatarPopOver;
