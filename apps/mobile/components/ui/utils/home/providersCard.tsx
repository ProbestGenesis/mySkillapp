import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Star } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

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
      <DialogContent className="max-h-[85%] w-[90%] rounded-2xl">
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
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-3 pb-4">
              <View className="flex-row items-center gap-2">
                <Avatar alt="provider" className="size-20">
                  <AvatarImage source={{ uri: provider.user?.image ?? undefined }} />
                  <AvatarFallback />
                </Avatar>

                <View className="flex-col">
                  <Text className="text-foreground text-xl font-bold">{provider.user?.name}</Text>
                  <Text className="text-primary font-semibold">{provider.profession}</Text>

                  <View className="flex-row items-center gap-2">
                    <View className="flex-row items-center">
                      <Text className="text-xs">{provider.rate}</Text>
                      <Star size={12} color="#FFD700" />
                    </View>

                    <Text className="flex-row items-center text-xs">
                      {provider.mission_nb} missions
                    </Text>
                  </View>
                </View>
              </View>

              {provider.bio ? (
                <Text className="text-muted-foreground text-left text-sm ps-1.5">{provider.bio}</Text>
              ) : null}
            </View>

            {provider.skills.length > 0 ? (
              <View className="gap-2">
                <Text className="text-foreground font-bold">Compétences</Text>
                {provider.skills.map((s) => (
                  <View key={s.id} className="bg-muted/50 rounded-lg px-3 py-2">
                    <Text className="font-medium">{s.title}</Text>
                    <Text className="text-muted-foreground text-xs">{s.description}</Text>
                    <Text className="text-primary mt-1 text-xs font-semibold">
                      À partir de {s.average_price} €
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-muted-foreground text-sm">Aucune compétence renseignée.</Text>
            )}

            <Button className="mt-6 rounded-full" variant="outline" onPress={onClose}>
              <Text>Fermer</Text>
            </Button>
          </ScrollView>
        )}
      </DialogContent>
    </Dialog>
  );
}
