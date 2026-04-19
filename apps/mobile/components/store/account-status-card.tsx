import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

interface AccountStatusCardProps {
  myItemsCount: number;
  isPartner: boolean;
  freeLimit: number;
  freeWindowDays: number;
  remainingFreePublications: number;
  partnerUntil?: string;
}

export function AccountStatusCard({
  myItemsCount,
  isPartner,
  freeLimit,
  freeWindowDays,
  remainingFreePublications,
  partnerUntil,
}: AccountStatusCardProps) {
  const router = useRouter();

  return (
    <Card className="from-card gap-1.5 to-card/50 border-secondary/30 border-2 bg-gradient-to-br">
      <CardHeader className="pb-2">
        <View className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Mes annonces</CardTitle>
          <Badge variant={isPartner ? 'default' : 'secondary'}>
            <Text>{isPartner ? 'Partenaire' : 'Particulier'}</Text>
          </Badge>
        </View>
        <CardDescription>
          Vous ne pouvez publier que 2 articles chaque 2 semaine, devez un partenaire pour pourvoir
          en publier d'avantage.
        </CardDescription>
      </CardHeader>

      <CardContent className="gap-3">
        {/*    <View className="gap-1.5">
          <Text className="text-2xl font-bold text-primary">{myItemsCount}</Text>
          <Text className="text-xs text-muted-foreground font-medium">
            Annonces publiées
          </Text>
        </View>*/}

        {!isPartner ? (
          <>
            <View className="bg-secondary/20 gap-2 rounded-lg p-3">
              <Text className="text-foreground text-xs font-semibold">Limite particulier</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted-foreground text-sm">
                  {remainingFreePublications} / {freeLimit} annonces
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Tous les {freeWindowDays} jours
                </Text>
              </View>
            </View>

            <Button className="mt-1" onPress={() => router.push('/(tabs)/store/partner')}>
              <Text className="text-sm font-semibold text-white">Devenir partenaire</Text>
            </Button>
          </>
        ) : (
          <>
            <View className="bg-primary/10 gap-2 rounded-lg p-3">
              <Text className="text-primary text-xs font-semibold">Publications illimitées</Text>
              <Text className="text-foreground text-sm font-medium">
                Jusqu'au {partnerUntil ? new Date(partnerUntil).toLocaleDateString() : '-'}
              </Text>
            </View>

            <Button variant="outline" onPress={() => router.push('/(tabs)/store/partner')}>
              <Text className="font-semibold">Gérer mon abonnement</Text>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
