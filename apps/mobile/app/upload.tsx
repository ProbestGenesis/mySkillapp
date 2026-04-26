import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Video as VideoCompressor } from 'expo-image-and-video-compressor';
import { useTRPC } from '@/provider/appProvider';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

// ⚠️ À CONFIGURER : Tes identifiants Cloudinary
const CLOUDINARY_CLOUD_NAME = 'TON_CLOUD_NAME';
const CLOUDINARY_UPLOAD_PRESET = 'TON_UPLOAD_PRESET'; // Assure-toi que ce preset est en mode "Unsigned"

export default function VideoUploadPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploadingToCloudinary, setIsUploadingToCloudinary] = useState(false);

  // Procédure tRPC pour sauvegarder l'URL en base de données
  const saveUrlMutation = useMutation(
    trpc.media.saveVideoUrl.mutationOptions({
      onSuccess: (data) => {
        setUploadedUrl(data.videoUrl);
        Alert.alert('Succès', 'Vidéo importée et URL enregistrée avec succès !');
      },
      onError: (error) => {
        Alert.alert('Erreur', error.message || "Erreur lors de la sauvegarde de l'URL");
      }
    })
  );

  const pickVideo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission refusée", "Vous devez autoriser l'accès à vos vidéos pour continuer.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setVideoUri(result.assets[0].uri);
      setUploadedUrl(null); 
    }
  };

  const handleUpload = async () => {
    if (!videoUri) {
      Alert.alert("Erreur", "Veuillez d'abord sélectionner une vidéo.");
      return;
    }

    if (CLOUDINARY_CLOUD_NAME === 'TON_CLOUD_NAME') {
      Alert.alert("Configuration requise", "Veuillez configurer vos identifiants Cloudinary dans le code.");
      return;
    }

    try {
      // 1. Compresser la vidéo
      setIsCompressing(true);
      const compressedUri = await VideoCompressor.compress(videoUri, {
        compressionMethod: 'auto',
      });
      setIsCompressing(false);

      // 2. Upload vers Cloudinary directement depuis le client
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
            'Accept': 'application/json',
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
        description: "Ma super vidéo !", // Tu peux ajouter un champ texte pour ça plus tard
      });

    } catch (err: any) {
      setIsCompressing(false);
      setIsUploadingToCloudinary(false);
      console.error('Erreur Upload:', err);
      Alert.alert("Erreur", err.message || "L'upload vers Cloudinary a échoué.");
    }
  };

  const isWorking = saveUrlMutation.isPending || isCompressing || isUploadingToCloudinary;

  const getStatusText = () => {
    if (isCompressing) return 'Compression...';
    if (isUploadingToCloudinary) return 'Envoi vers Cloudinary...';
    if (saveUrlMutation.isPending) return 'Sauvegarde en base...';
    return 'Envoyer le Reel';
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen 
        options={{ 
          title: 'Uploader un Reel',
          headerShadowVisible: false,
        }} 
      />
      
      <View className="flex-1 px-6 pt-4 items-center">
        
        <Text className="text-2xl font-bold mb-2 text-center text-gray-900">
          Importer une vidéo
        </Text>
        <Text className="text-gray-500 text-center mb-8 px-4 leading-5">
          La vidéo sera compressée et uploadée directement sur Cloudinary.
        </Text>

        <TouchableOpacity 
          onPress={pickVideo}
          activeOpacity={0.8}
          className="w-full aspect-[3/4] bg-gray-50 rounded-[32px] items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden mb-8"
        >
          {videoUri ? (
            <View className="items-center justify-center bg-black/5 w-full h-full">
              <Ionicons name="play-circle-outline" size={64} color="#1f2937" />
              <Text className="text-gray-700 mt-2 font-medium">Vidéo sélectionnée</Text>
            </View>
          ) : (
            <View className="items-center">
              <View className="bg-gray-200 p-4 rounded-full mb-4">
                <Ionicons name="videocam-outline" size={48} color="#9ca3af" />
              </View>
              <Text className="text-gray-500 font-medium">Appuyez pour choisir</Text>
            </View>
          )}
        </TouchableOpacity>

        <View className="w-full mt-auto mb-8 space-y-4">
          <TouchableOpacity
            onPress={pickVideo}
            className="w-full bg-gray-100 py-4 rounded-full items-center mb-3"
            disabled={isWorking}
          >
            <Text className="text-gray-800 font-bold text-[16px]">
              {videoUri ? 'Changer de vidéo' : 'Sélectionner une vidéo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleUpload}
            disabled={!videoUri || isWorking}
            className={`w-full py-4 rounded-full items-center flex-row justify-center shadow-sm ${
              !videoUri ? 'bg-gray-300' : 'bg-black'
            }`}
          >
            {isWorking ? (
              <>
                <ActivityIndicator color="white" className="mr-3" />
                <Text className="text-white font-bold text-[16px]">
                  {getStatusText()}
                </Text>
              </>
            ) : (
              <Text className="text-white font-bold text-[16px]">
                {getStatusText()}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {uploadedUrl && (
          <View className="absolute bottom-8 p-4 bg-green-50 rounded-2xl w-11/12 border border-green-200 shadow-sm self-center">
            <View className="flex-row items-center mb-1">
              <Ionicons name="checkmark-circle" size={20} color="#15803d" className="mr-2" />
              <Text className="text-green-800 font-bold text-[15px] ml-1">Reel publié !</Text>
            </View>
            <Text className="text-green-700 text-[12px] mt-1" numberOfLines={2}>
              {uploadedUrl}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
