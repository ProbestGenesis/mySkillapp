{
  /**Les functions commençans par une majuscule sont celle qui tetourne des valeurs directement afficher dans l'interface */
}
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ServicesBulles from '@/components/ui/utils/home/servicesBulles';
import UserAvatarPopOver from '@/components/ui/utils/userAvatarPopOver';
import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View,  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/lib/auth-client';

type Props = {};

function index({}: Props) {
  const { data: session } = useSession()
 
  const [role, setRole] = useState<'Provider' | 'Customer'>('Provider');

  const handleRole = () => {
    const r = role === 'Provider' ? 'Customer' : 'Provider';
    setRole(r);
  };

  const Role = (item: 'Provider' | 'Customer') => {
    switch (item) {
      case 'Customer':
        return 'Clients';
      case 'Provider':
        return 'Prestatairs';
    }
  };
  const isPrestairePage = true;
  const userName = session?.user.name ;
  return (
    <SafeAreaView className="flex-1">
      <View className={`h-screen flex-col pb-8`}>
        <View className="flex-1 flex-col px-2">
          <View className="flex-row items-center justify-between">
            {isPrestairePage ? (
              <Button className="rounded-full" variant="outline" onPress={handleRole}>
                <Search /> <Text>{Role(role)}</Text>
              </Button>
            ) : (
              <Button className="rounded-full" variant="outline" onPress={handleRole}>
                <Search /> <Text>{Role(role)}</Text>
              </Button>
            )}

            <View>
              <UserAvatarPopOver />
            </View>
          </View>

          <View className="flex-1 flex-col items-center justify-center gap-2">
            <Avatar alt={'UserProfil'} className="size-24">
              <AvatarImage src="" />
              <AvatarFallback>
                <Text>{userName?.slice(0, 2).toUpperCase() ?? "BN"}</Text>
              </AvatarFallback>
            </Avatar>

            <View>
              <Text className="text-xl font-bold">{userName}</Text>
            </View>
          </View>
        </View>

        <View className="w-full h-16">
          <ServicesBulles />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default index;
