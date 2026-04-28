import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import type { NearProviderRow } from '@/components/ui/utils/home/providersCheckRadar';
import { Link } from 'expo-router';
import { Star } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../text';

/** Aligné sur `providers.getProvider`. */
export type ProviderDetail = {
  id: string;
  profession: string;
  bio: string | null;
  user: { name: string; image: string | null } | null;
  skills: { id: string; title: string; description: string; average_price: number }[];
  rate: number;
  mission_nb: number;
} | null;

type Props = {
  provider: NearProviderRow;
  viewProviderCard: boolean;
  onClose: () => void;
  providerCardDataLoading: boolean;
};

export function ProviderCard({
  provider,
  viewProviderCard,
  onClose,
  providerCardDataLoading,
}: Props) {
  return (
    <Dialog
      open={viewProviderCard}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}>
      <DialogContent className="w-full min-w-xs gap-0 rounded-2xl">
        {providerCardDataLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator />
            <Text className="text-muted-foreground mx-auto mt-3 text-center text-sm">
              Chargement…
            </Text>
          </View>
        ) : !provider ? (
          <Text className="text-muted-foreground text-center">Prestataire introuvable.</Text>
        ) : (
          <>
            {/* ── Header : avatar + infos ── */}
            <View className="gap-1">
              <Link
                href={{
                  pathname: '/provider/[providerId]',
                  params: {
                    providerId: provider.id,
                  },
                }}
                asChild>
                <Pressable onPress={onClose} className="flex-row items-center gap-2">
                  <Avatar alt="provider" className="size-20">
                    <AvatarImage source={{ uri: provider.user?.image ?? undefined }} />
                    <AvatarFallback />
                  </Avatar>

                  <View className="flex-col">
                    <Text className="text-foreground text-xl font-bold">{provider.user?.name}</Text>
                    <Text className="text-primary font-semibold">{provider.profession}</Text>

                    <View className="flex-row items-center gap-1.5">
                      <View className="flex-row items-center gap-0.5">
                        <Text className="text-xs">{provider.rate}</Text>
                        <Star size={12} color="#FFD700" />
                      </View>
                      <Text className="text-xs">{provider.mission_nb} missions</Text>
                    </View>
                  </View>
                </Pressable>
              </Link>

              <View>
                {provider.bio ? (
                  <Text className="text-muted-foreground ps-1 text-left text-sm">
                    {provider.bio.trim()}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* ── Compétences ── */}
            <ScrollView className="mt-2 max-h-36" showsVerticalScrollIndicator={false}>
              {provider.skills.length > 0 ? (
                <View className="gap-1">
                  <Text className="text-foreground mb-0.5 text-sm font-bold">
                    Compétences particulières
                  </Text>
                  {provider.skills.map((s) => (
                    <Link
                      href={{
                        pathname: '/provider/[providerId]/contact',
                        params: {
                          providerId: provider.id,
                          skillId: s.id,
                        },
                      }}
                      key={s.id}
                      asChild>
                      <Pressable
                        onPress={onClose}
                        style={{}}
                        className="bg-muted/50 rounded-lg px-3 py-1">
                        <Text className="text-sm font-medium">{s.title}</Text>
                        <Text className="text-primary text-xs font-semibold">
                          À partir de {s.average_price} fcfa
                        </Text>
                      </Pressable>
                    </Link>
                  ))}
                </View>
              ) : (
                <Text className="text-muted-foreground text-sm">Aucune compétence renseignée.</Text>
              )}
            </ScrollView>

            {/* ── Actions ── */}
            <DialogFooter className="mt-2 flex-row justify-end gap-2">
              <Button className="rounded-full" variant="outline" onPress={onClose}>
                <Text>Fermer</Text>
              </Button>
              <Link
                href={{
                  pathname: '/provider/[providerId]/contact',
                  params: {
                    providerId: provider.id,
                  },
                }}
                asChild>
                <Button className="rounded-full" onPress={onClose}>
                  <Text className="text-white">Contacter</Text>
                </Button>
              </Link>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
