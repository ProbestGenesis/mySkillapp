import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Star } from 'lucide-react-native';
import { Text } from '../../text';
import { ActivityIndicator, ScrollView, View } from 'react-native';

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
  provider: ProviderDetail | undefined;
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
      <DialogContent className="w-full gap-0 rounded-2xl">
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
              <View className="flex-row items-center gap-2">
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
              </View>

              {provider.bio ? (
                <Text className="text-muted-foreground ps-1 text-left text-sm">{provider.bio}</Text>
              ) : null}
            </View>

            {/* ── Compétences ── */}
            <ScrollView className="max-h-36 mt-2" showsVerticalScrollIndicator={false}>
              {provider.skills.length > 0 ? (
                <View className="gap-1">
                  <Text className="text-foreground text-sm font-bold mb-0.5">Compétences</Text>
                  {provider.skills.map((s) => (
                    <View key={s.id} className="bg-muted/50 rounded-lg px-3 py-1">
                      <Text className="text-sm font-medium">{s.title}</Text>
                      <Text className="text-primary text-xs font-semibold">
                        À partir de {s.average_price} fcfa
                      </Text>
                    </View>
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
              <Button className="rounded-full">
                <Text className="text-white">Contacter</Text>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
