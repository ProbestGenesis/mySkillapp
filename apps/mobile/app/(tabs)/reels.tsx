import { ReelsFeed } from '@/components/reels/ReelsFeed';
import React from 'react';
import { View } from 'react-native';

const DUMMY_REELS = [
  {
    id: '1',
    url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/1200px-Big_buck_bunny_poster_big.jpg',
    description: 'Découvrez cette vidéo incroyable en plein écran !',
    username: 'creator_one',
  },
  {
    id: '2',
    url: 'https://test-videos.co.uk/vids/sintel/mp4/h264/1080/Sintel_1080_10s_1MB.mp4',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Sintel_poster.jpg/1200px-Sintel_poster.jpg',
    description: 'Une autre vidéo incroyable pour tester notre super feed de Reels.',
    username: 'sintel_fan',
  },
  {
    id: '3',
    url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_1MB.mp4',
    thumbnail: 'https://static.vecteezy.com/system/resources/previews/000/094/732/original/jelly-fish-vector.jpg',
    description: 'Regardez ces magnifiques méduses.',
    username: 'ocean_lover',
  }
];

export default function ReelsScreen() {
  return (
    <View className="flex-1 bg-black">
      <ReelsFeed data={DUMMY_REELS} />
    </View>
  );
}
