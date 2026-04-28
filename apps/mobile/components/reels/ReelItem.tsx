import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTRPC } from '@/provider/appProvider';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Pressable, Text, View } from 'react-native';
import { CommentDrawer } from './CommentDrawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Button } from '../ui/button';
import { Plus, Video } from 'lucide-react-native';
const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

export interface ReelData {
  id: string;
  url: string;
  thumbnail: string;
  description: string;
  username: string;
  userId: string;
  userImage: string | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
}

interface ReelItemProps {
  item: ReelData;
  isActive: boolean;
  shouldLoad: boolean;
  containerHeight: number;
}

export const ReelItem = React.memo(
  ({ item, isActive, shouldLoad, containerHeight }: ReelItemProps) => {
    const [isBuffering, setIsBuffering] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showComments, setShowComments] = useState(false);
    const trpc = useTRPC();
    const queryClient = useQueryClient()
    // Optimistic UI for likes
    const [isLiked, setIsLiked] = useState(item.isLiked);
    const [likesCount, setLikesCount] = useState(item.likesCount);

    
    const toggleLikeMutation = useMutation({
      ...trpc.reel.toggleLike.mutationOptions(),
       onSuccess : () => {
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));
      },
      onError: (err) => {
        // Rollback on error
        setIsLiked(item.isLiked);
        setLikesCount(item.likesCount);
      }
    });

    const player = useVideoPlayer(shouldLoad ? item.url : null, (p) => {
      p.loop = true;
      p.muted = false;
    });

    useEffect(() => {
      if (isActive) {
        player.play();
        setIsPlaying(true);
      } else {
        player.pause();
        setIsPlaying(false);
      }
    }, [isActive, player]);

    const togglePlayPause = () => {
      if (player.playing) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    };

    useEffect(() => {
      const subscription = player.addListener('statusChange', (status) => {
        if (status === 'readyToPlay') setIsBuffering(false);
      });
      return () => subscription.remove();
    }, [player]);

    const handleLike = () => {
      toggleLikeMutation.mutate({ reelId: item.id });
    };

    return (
      <View
        className="bg-black justify-center"
        style={{ height: containerHeight, width: WINDOW_WIDTH }}>
        
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

        {/* Lecteur Vidéo avec contrôle */}
        {shouldLoad && (
          <Pressable className="absolute inset-0 " onPress={togglePlayPause}>
            <VideoView
              className="absolute inset-0  "
              style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
              player={player}
              fullscreenOptions={{ enable: true }}
              nativeControls={false}
              contentFit="contain"
            />
            {!isPlaying && !isBuffering && (
              <View className="absolute inset-0 z-10 items-center justify-center bg-black/70 pointer-events-none">
                <Ionicons name="play" size={80} color="white" style={{ opacity: 0.8 }} />
              </View>
            )}
          </Pressable>
        )}

        {/* Overlay Bas Gauche : Infos Utilisateur */}
        <View className="absolute bottom-4 left-4 right-20">
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
        
        {/* Sidebar Droite haut : Actions */}
        <View className='absolute top-15 right-3 items-center'>
          <Link asChild href="/(tabs)/reels/upload" className='bg-white' >
            <Button variant={"ghost"}>
              <Plus className='text-white' size={12} />  <Video  className='text-white' />
            </Button>
          </Link>

        </View>
        {/* Sidebar Droite bas : Actions */}
        <View className="absolute bottom-4 right-3 items-center">
          <Pressable className="mb-5 items-center" onPress={handleLike}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={36} color={isLiked ? "#ff2d55" : "white"} />
            <Text
              className="mt-1.5 text-[13px] font-semibold text-white shadow-sm"
              style={{
                textShadowColor: 'rgba(0, 0, 0, 0.75)',
                textShadowOffset: { width: -1, height: 1 },
                textShadowRadius: 10,
              }}>
              {likesCount}
            </Text>
          </Pressable>
          <Pressable className="mb-5 items-center" onPress={() => setShowComments(true)}>
            <Ionicons name="chatbubble" size={34} color="white" />
            <Text
              className="mt-1.5 text-[13px] font-semibold text-white shadow-sm"
              style={{
                textShadowColor: 'rgba(0, 0, 0, 0.75)',
                textShadowOffset: { width: -1, height: 1 },
                textShadowRadius: 10,
              }}>
              {item.commentsCount}
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

        <CommentDrawer 
          visible={showComments} 
          reelId={item.id} 
          onClose={() => setShowComments(false)} 
          commentCount={item.commentsCount}
        />
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
