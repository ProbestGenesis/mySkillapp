import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

interface SearchHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  isRefetching: boolean;
  session: any;
}

export function SearchHeader({
  search,
  onSearchChange,
  onRefresh,
  isRefetching,
  session,
}: SearchHeaderProps) {
  const router = useRouter();

  return (
    <View className="gap-4">
      <Input
        placeholder="Rechercher"
        value={search}
        onChangeText={onSearchChange}
        className="bg-secondary/40"
      />

      <View className="flex-row gap-2">
        {session ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="w-full">
            <View className="flex-row gap-2">
              <Link href="/(tabs)/store/new" asChild>
                <Button size="sm" className="flex-1 rounded-full">
                  <Text className="text-xs font-bold text-white">Créer annonce</Text>
                </Button>
              </Link>

              <Link href="/(tabs)/store/messages" asChild>
                <Button variant="outline" size="sm" className="flex-1 rounded-full">
                  <Text className="text-xs font-semibold">Messagerie</Text>
                </Button>
              </Link>

              <Link href="/(tabs)/store/messages" asChild>
                <Button variant="outline" size="sm" className="flex-1 rounded-full">
                  <Text className="text-xs font-semibold">Catégorie</Text>
                </Button>
              </Link>

              <Link href="/(tabs)/store/messages" asChild>
                <Button variant="outline" size="sm" className="flex-1 rounded-full">
                  <Text className="text-xs font-semibold">Préférence</Text>
                </Button>
              </Link>
            </View>
          </ScrollView>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onPress={() => router.push('/auth')}>
            <Text className="font-semibold">Se connecter</Text>
          </Button>
        )}
      </View>
    </View>
  );
}
