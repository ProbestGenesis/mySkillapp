import { Button } from '@/components/ui/button';
import { Stack } from 'expo-router';
import { MessageCircle, Plus } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { Link } from 'expo-router';

type Props = {};

function StoreLayout({}: Props) {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Marketplace',
          headerLargeTitle: true,
          headerBackVisible: false,
          headerRight: () => {
            return (
              <View className="flex-row items-center gap-2">
                <Link href="/store/new" asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Plus />
                  </Button>
                </Link>

                <Link href="/(tabs)/store/messages" asChild>
                  <Button variant={'outline'} size={'icon'} className="rounded-full">
                    <MessageCircle />
                  </Button>
                </Link>
              </View>
            );
          },
        }}
      />
      <Stack.Screen name="new" options={{ title: 'Nouvelle annonce' }} />
      <Stack.Screen name="partner" options={{ title: 'Partenaire' }} />
      <Stack.Screen name="[itemId]" options={{ title: 'Détail annonce' }} />
      <Stack.Screen name="messages/index" options={{ title: 'Discussions' }} />
      <Stack.Screen name="messages/[conversationId]" options={{ title: 'Messagerie' }} />
    </Stack>
  );
}

export default StoreLayout;
