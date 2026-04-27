import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Pressable, Text, View } from 'react-native';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

export interface ReelData {
  id: string;
  url: string;
  thumbnail: string;
  description: string;
  username: string;
}

interface ReelItemProps {
  item: ReelData;
  isActive: boolean;
  shouldLoad: boolean;
}

export const ReelItem = React.memo(
  ({ item, isActive, shouldLoad }: ReelItemProps) => {
    const [isBuffering, setIsBuffering] = useState(true);

    const player = useVideoPlayer(shouldLoad ? item.url : null, (p) => {
      p.loop = true;
      p.muted = false;
    });

    useEffect(() => {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    }, [isActive, player]);

    useEffect(() => {
      const subscription = player.addListener('statusChange', (status) => {
        if (status === 'readyToPlay') setIsBuffering(false);
      });
      return () => subscription.remove();
    }, [player]);

    return (
      <View
        className="bg-black justify-center"
        style={{ height: WINDOW_HEIGHT, width: WINDOW_WIDTH }}>
        
        {/* Affichage du Thumbnail en attendant le chargement de la vidéo */}
        {(!shouldLoad || isBuffering) && (
          <View className="absolute inset-0 items-center justify-center">
            <Image
              source={{ uri: item.thumbnail }}
              className="absolute inset-0 opacity-50"
              style={{ width: '100%', height: '100%' }}
              blurRadius={8}
            />
            <ActivityIndicator size="large" color="#ffffff" className="absolute" />
          </View>
        )}

        {/* Lecteur Vidéo */}
        {shouldLoad && (
          <VideoView
            className="absolute inset-0"
            style={{ width: '100%', height: '100%' }}
            player={player}
            fullscreenOptions={{ enable: true }}
           
            nativeControls={false}
            contentFit="cover"
          />
        )}

        {/* Overlay Bas Gauche : Infos Utilisateur */}
        <View className="absolute bottom-[90px] left-4 right-20">
          <Text
            className="mb-2 text-[17px] font-bold text-white shadow-sm"
            style={{
              textShadowColor: 'rgba(0, 0, 0, 0.75)',
              textShadowOffset: { width: -1, height: 1 },
              textShadowRadius: 10,
            }}>
            @{item.username}
          </Text>
          <Text
            className="text-sm text-white shadow-sm"
            numberOfLines={2}
            style={{
              textShadowColor: 'rgba(0, 0, 0, 0.75)',
              textShadowOffset: { width: -1, height: 1 },
              textShadowRadius: 10,
            }}>
            {item.description}
          </Text>
        </View>

        {/* Sidebar Droite : Actions */}
        <View className="absolute bottom-[90px] right-3 items-center">
          <Pressable className="mb-5 items-center">
            <Ionicons name="heart" size={36} color="white" />
            <Text
              className="mt-1.5 text-[13px] font-semibold text-white shadow-sm"
              style={{
                textShadowColor: 'rgba(0, 0, 0, 0.75)',
                textShadowOffset: { width: -1, height: 1 },
                textShadowRadius: 10,
              }}>
              Like
            </Text>
          </Pressable>
          <Pressable className="mb-5 items-center">
            <Ionicons name="chatbubble" size={34} color="white" />
            <Text
              className="mt-1.5 text-[13px] font-semibold text-white shadow-sm"
              style={{
                textShadowColor: 'rgba(0, 0, 0, 0.75)',
                textShadowOffset: { width: -1, height: 1 },
                textShadowRadius: 10,
              }}>
              245
            </Text>
          </Pressable>
          <Pressable className="mb-5 items-center">
            <Ionicons name="share-social" size={36} color="white" />
            <Text
              className="mt-1.5 text-[13px] font-semibold text-white shadow-sm"
              style={{
                textShadowColor: 'rgba(0, 0, 0, 0.75)',
                textShadowOffset: { width: -1, height: 1 },
                textShadowRadius: 10,
              }}>
              Partager
            </Text>
          </Pressable>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isActive === nextProps.isActive &&
      prevProps.shouldLoad === nextProps.shouldLoad &&
      prevProps.item.id === nextProps.item.id
    );
  }
);
