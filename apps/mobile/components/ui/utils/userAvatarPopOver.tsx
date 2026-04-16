import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut, updateUser, useSession } from '@/lib/auth-client';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, Link } from 'expo-router';
import { Camera, Check, LogOut } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { Button } from '../button';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Role } from '@/app/(tabs)';


type Props = {};

function UserAvatarPopOver({}: Props) {
  const { data: session } = useSession();
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const username = session?.user.name ?? 'Guest';
  const profilImage =  session?.user.image
  const email = session?.user.email;

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
              <Link  href="/settings/profilPicture"> 
              <Avatar alt={'User Avatar'} className="border-primary/10 size-12 border-2">
                <AvatarImage src={profilImage ?? ""} />
                <AvatarFallback className="bg-primary/5">
                  <Text className="text-primary font-bold">
                    {username.slice(0, 1).toUpperCase()}
                  </Text>
                </AvatarFallback>
              </Avatar>
              </Link>

            <View className="flex-1">
              <Text className="text-foreground text-lg font-bold" numberOfLines={1}>
                {username}
              </Text>
            </View>
          </View>

          <View className="flex-col gap-2">
          {session?.user.role === "CUSTOMER" && (
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
        </View>
      </PopoverContent>
    </Popover>
  );
}

export default UserAvatarPopOver;
