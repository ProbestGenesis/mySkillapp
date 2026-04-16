{
  /**Les functions commençans par une majuscule sont celle qui tetourne des valeurs directement afficher dans l'interface */
}
import { Button } from '@/components/ui/button';
import AddPostCard from '@/components/ui/utils/home/addPostcard';
import CustomerCheckRadar from '@/components/ui/utils/home/CustomerCheckRadar';
import ProviderCheckRadar from '@/components/ui/utils/home/providersCheckRadar';
import ServicesBulles from '@/components/ui/utils/home/servicesBulles';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {};

function index({}: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showPostCard, setShowPostCard] = useState(false);

  const [role, setRole] = useState<'PROVIDER' | 'CUSTOMER'>('PROVIDER');

  const handleRole = () => {
    const r = role === 'PROVIDER' ? 'CUSTOMER' : 'PROVIDER';
    setRole(r);
  };

  const isPrestairePage = true;
  const userName = session?.user.name;
  return (
    <SafeAreaView className="flex-1">
      <View className={`h-screen flex-col pt-2 pb-8`}>
        <View className="flex-1 flex-col px-2">
          <View className="flex-row items-center justify-between">
            {isPrestairePage ? (
              <Button className="rounded-full" variant="outline" onPress={handleRole}>
                <Search />
                <Text>{Role(role)}</Text>
              </Button>
            ) : (
              <Button className="rounded-full" variant="outline" onPress={handleRole}>
                <Search />
                <Text>{Role(role)}</Text>
              </Button>
            )}

            {!session ? (
              <Button
                variant={'outline'}
                className="rounded-full"
                onPress={() => {
                  router.push('/auth');
                }}>
                <Text>Se connecter</Text>
              </Button>
            ) : (
              <View>
                <Button
                  className="rounded-full"
                  variant={'outline'}
                  size={'sm'}
                  onPress={() => {
                    setShowPostCard(true);
                  }}>
                  <Text className="dark:text-white">Demande de service</Text>
                </Button>
              </View>
            )}
          </View>

          <View className={`min-h-[calc(100vh-198px)]`}>
            {role === 'PROVIDER' ? <ProviderCheckRadar /> : <CustomerCheckRadar />}
          </View>
        </View>

        <AnimatePresence>
          {showPostCard && (
            <MotiView
              className="absolute top-0 z-50"
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                type: 'spring',
                duration: 0.3,
              }}>
              <AddPostCard
                onClose={() => {
                  setShowPostCard(false);
                }}
              />
            </MotiView>
          )}
        </AnimatePresence>

        <View className="h-16 w-full">
          <ServicesBulles />
        </View>
      </View>
    </SafeAreaView>
  );
}

export const Role = (item: 'PROVIDER' | 'CUSTOMER') => {
  switch (item) {
    case 'CUSTOMER':
      return 'Clients';
    case 'PROVIDER':
      return 'Prestatairs';
  }
};

export default index;
