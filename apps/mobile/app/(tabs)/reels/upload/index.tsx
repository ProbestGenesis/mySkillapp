import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTRPC } from '@/provider/appProvider';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { compress } from 'expo-image-and-video-compressor';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import z from 'zod';

const CLOUDINARY_CLOUD_NAME = 'dk30akh2m';
const CLOUDINARY_UPLOAD_PRESET = 'reelUpload';

export default function VideoUploadPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const insets = useSafeAreaInsets();

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Rejouer quand videoUri change
  useEffect(() => {
    if (videoUri && player) {
      player.play();
    }
  }, [videoUri, player]);

  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploadingToCloudinary, setIsUploadingToCloudinary] = useState(false);
  const formSchema = z.object({
    description: z.string().optional(),
  })

  // Procédure tRPC pour sauvegarder l'URL en base de données
  const saveUrlMutation = useMutation(
    trpc.media.saveVideoUrl.mutationOptions({
      onSuccess: (data) => {
        setUploadedUrl(data.videoUrl);
        Alert.alert('Succès', 'Vidéo importée et URL enregistrée avec succès !');
      },
      onError: (error) => {
        Alert.alert('Erreur', error.message || "Erreur lors de la sauvegarde de l'URL");
      },
    })
  );

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
    },
  });

  const pickVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'video/mp4',
      multiple: false, // true si tu veux plusieurs fichiers
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    if (result.assets && result.assets.length > 0) {
      setVideoUri(result.assets[0]?.uri);
    }
  };

  const handleUpload = async (value: z.infer<typeof  formSchema>) => {
    if (!videoUri) {
      Alert.alert('Erreur', "Veuillez d'abord sélectionner une vidéo.");
      return;
    }

    {
      /* if (CLOUDINARY_CLOUD_NAME === 'reelUpload') {
      Alert.alert(
        'Configuration requise',
        'Veuillez configurer vos identifiants Cloudinary dans le code.'
      );
      return;
    }*/
    }

    try {
      // 1. Compresser la vidéo
      setIsCompressing(true);
      const compressedUri = await compress(
        videoUri,
        {
          bitrate: 1_500_000,
          maxSize: 1080, // Scale down to 1080p
          codec: 'h264', //~40% smaller output
          speed: 'ultrafast',
        },
        (progress) => {
          console.log('Compression progress:', progress);
        }
      );
      setIsCompressing(false);

      setIsUploadingToCloudinary(true);

      const formData = new FormData();
      formData.append('file', {
        uri: compressedUri,
        type: 'video/mp4',
        name: `reel_${Date.now()}.mp4`,
      } as any);

      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('resource_type', 'video');

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();
      setIsUploadingToCloudinary(false);

      if (cloudinaryData.error) {
        throw new Error(cloudinaryData.error.message);
      }

      const finalVideoUrl = cloudinaryData.secure_url;

      // 3. Sauvegarder l'URL via notre backend Express (tRPC)
      saveUrlMutation.mutate({
        videoUrl: finalVideoUrl,
        description: value.description, 
      });
    } catch (err: any) {
      setIsCompressing(false);
      setIsUploadingToCloudinary(false);
      console.error('Erreur Upload:', err);
      Alert.alert('Erreur', err.message || "L'upload vers Cloudinary a échoué.");
    }
  };

  const isWorking = saveUrlMutation.isPending || isCompressing || isUploadingToCloudinary;

  const getStatusText = () => {
    if (isCompressing) return 'Compression...';
    if (isUploadingToCloudinary) return 'En cours de telechargement...';
    if (saveUrlMutation.isPending) return "c'est presque prêt";
    return 'Envoyer le Reel';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + 50}>
      <ScrollView showsVerticalScrollIndicator={false} className='pb-30'>
        <View className="h-full items-center px-6">
          <View className="mt-2 flex-row gap-0.5">
            <Text className="mb-8 px-4 text-center text-2xl leading-5 font-bold text-gray-500">
              Demontrer votre savoir faire en partageant un REEL
            </Text>
          </View>

          <TouchableOpacity
            onPress={pickVideo}
            activeOpacity={0.8}
            className="mb-8 aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-[32px] border-2 border-dashed border-gray-300 bg-gray-50">
            {videoUri ? (
              <View className="h-full w-full overflow-hidden rounded-[32px] bg-black">
                <VideoView
                  player={player}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  nativeControls={true}
                />
              </View>
            ) : (
              <View className="items-center">
                <View className="mb-4 rounded-full bg-gray-200 p-4">
                  <Ionicons name="videocam-outline" size={48} color="#9ca3af" />
                </View>
                <Text className="font-medium text-gray-500">Appuyez pour choisir</Text>
              </View>
            )}
          </TouchableOpacity>

          <View className="mt-auto mb-8 w-full gap-4">
            <Button
              onPress={pickVideo}
              className="w-full rounded-full"
              variant="outline"
              disabled={isWorking}>
              <Text className="text-[16px] font-bold text-gray-800">
                {videoUri ? 'Changer de vidéo' : 'Sélectionner une vidéo'}
              </Text>
            </Button>

            <Controller
              name="description"
              control={control}
              render={({ field: { onChange, value } }) => (
                <View className="mb-2 w-full flex-col gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={value}
                    onChangeText={onChange}
                    placeholder="Ajouter un courte description a votre reel"
                    className="mb-2 w-full rounded border px-3 py-2"
                  />
                </View>
              )}
            />

            <Button
              variant="default"
              onPress={() => handleSubmit(data => handleUpload(data))}
              disabled={!videoUri || isWorking}
              className={`mt-2 rounded-full`}>
              {isWorking ? (
                <>
                  <ActivityIndicator color="white" className="mr-3" />
                  <Text className="text-[16px] font-bold text-white">{getStatusText()}</Text>
                </>
              ) : (
                <Text className="text-[16px] font-bold text-white">{getStatusText()}</Text>
              )}
            </Button>
          </View>

          {uploadedUrl && (
            <View className="absolute bottom-8 w-11/12 self-center rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm">
              <View className="mb-1 flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#15803d" className="mr-2" />
                <Text className="ml-1 text-[15px] font-bold text-green-800">Reel publié !</Text>
              </View>
            </View>
          )}

          <View className="">
            <Text className="text-muted">
              L'envoie de reel est pour le moment uniquement accessible aux étudiants ou apprenti en
              formation. Toute publicité à une marque tierce sera supprimée.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
