import { PartnerLanding } from '@/components/store/partner-landing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authClient } from '@/lib/auth-client';
import { useTRPC } from '@/provider/appProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { CheckCircle, Clock, CreditCard, X, Zap } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SubscriptionStatus = 'paid' | 'pending' | 'expired' | 'cancelled';

const getStatusColor = (status: SubscriptionStatus) => {
  const colors: Record<
    SubscriptionStatus,
    { bg: string; text: string; icon: React.ComponentType<any> }
  > = {
    paid: { bg: 'bg-green-500/15', text: 'text-green-700 dark:text-green-400', icon: CheckCircle },
    pending: { bg: 'bg-blue-500/15', text: 'text-blue-700 dark:text-blue-400', icon: Clock },
    expired: { bg: 'bg-red-500/15', text: 'text-red-700 dark:text-red-400', icon: X },
    cancelled: { bg: 'bg-orange-500/15', text: 'text-orange-700 dark:text-orange-400', icon: X },
  };
  return colors[status] || colors.pending;
};

export default function StorePartnerScreen() {
  const [showLanding, setShowLanding] = useState(true);
  const { data: session } = authClient.useSession();
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: publishingStatus, isLoading: loadingStatus } = useQuery({
    ...trpc.store.getPublishingStatus.queryOptions(),
    enabled: !!session?.user?.id,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    ...trpc.store.listPartnerSubscriptions.queryOptions(),
    enabled: !!session?.user?.id,
  });

  const simulatePaymentMutation = useMutation(
    trpc.store.simulatePartnerPayment.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.store.getPublishingStatus.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.store.listPartnerSubscriptions.queryKey() });
      },
    })
  );

  if (!session) {
    return (
      <SafeAreaView className="h-screen flex-1">
        <View className="h-full w-full flex-col items-center justify-center gap-2">
          <Text className="text-accent text-center text-lg">
            {' '}
            Vous devez vous connecter pour acceder a cette page{' '}
          </Text>
          <Button
            className="rounded-full"
            variant={'outline'}
            size={'lg'}
            onPress={() => {
              router.push('/auth');
            }}>
            {' '}
            <Text>Se connecter</Text>{' '}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Show landing page if not yet dismissed
  if (showLanding) {
    return <PartnerLanding onSkip={() => setShowLanding(false)} />;
  }

  if (loadingStatus || loadingHistory) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isPartner = publishingStatus?.isPartner ?? false;
  const monthlyPrice = history?.monthlyPriceFcfa ?? 5000;
  const expirationDate = publishingStatus?.partnerUntil
    ? new Date(publishingStatus.partnerUntil).toLocaleDateString()
    : '-';
  const hasSubscriptions = (history?.subscriptions?.length ?? 0) > 0;

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex-1"
      transition={{ type: 'timing', duration: 500 }}>
      <ScrollView className="bg-background h-full flex-1" showsVerticalScrollIndicator={false}>
        <View className="h-full gap-6 px-4 py-6 pb-12">
          {/* Header Section */}
          <View className="gap-2">
            <Text className="text-foreground text-4xl font-bold">Partenaire Boutique</Text>
            <Text className="text-muted-foreground text-base">
              Gérez votre abonnement et publiez sans limite
            </Text>
          </View>

          {/* Premium Status Card */}
          <Card
            className={`overflow-hidden border-2 ${
              isPartner
                ? 'border-primary/30 from-primary/5 to-primary/0 bg-gradient-to-br'
                : 'border-secondary/30 from-secondary/30 to-secondary/10 bg-gradient-to-br'
            }`}>
            <CardHeader className="pb-4">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 gap-2">
                  <CardTitle className="text-2xl">
                    {isPartner ? 'Abonnement Actif' : 'Devenir Partenaire'}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {isPartner
                      ? 'Profitez des publications illimitées'
                      : 'Débloquez les publications sans limite'}
                  </CardDescription>
                </View>
                <Badge variant={isPartner ? 'default' : 'secondary'} className="shrink-0">
                  <Text className="font-semibold">
                    {isPartner ? '⭐ Partenaire' : 'Particulier'}
                  </Text>
                </Badge>
              </View>
            </CardHeader>

            <CardContent className="gap-4">
              {/* Status Details Grid */}
              <View className="gap-4 rounded-lg bg-black/5 p-4 dark:bg-white/5">
                <View className="flex-row justify-between">
                  <View className="flex-1 gap-1">
                    <Text className="text-muted-foreground text-xs font-medium">
                      Type d'abonnement
                    </Text>
                    <Text className="text-foreground text-lg font-bold">
                      {isPartner ? 'Partenaire' : 'Particulier'}
                    </Text>
                  </View>
                  <View className="flex-1 gap-1">
                    <Text className="text-muted-foreground text-xs font-medium">Tarif mensuel</Text>
                    <Text className="text-primary text-lg font-bold">
                      {monthlyPrice.toLocaleString()} FCFA
                    </Text>
                  </View>
                </View>

                <View className="border-border gap-1 border-t pt-3">
                  <Text className="text-muted-foreground text-xs font-medium">
                    {isPartner ? 'Expire le' : 'À partir de'}
                  </Text>
                  <Text className="text-foreground text-base font-semibold">{expirationDate}</Text>
                </View>
              </View>

              {/* CTA Button */}
              {/*   <Button
              onPress={() => simulatePaymentMutation.mutate()}
              disabled={simulatePaymentMutation.isPending}
              className={isPartner ? '' : 'bg-primary'}>
              <CreditCard size={20} color="white" />
              <Text className="font-semibold text-white">
                {simulatePaymentMutation.isPending
                  ? 'Traitement...'
                  : isPartner
                    ? 'Renouveler l\'abonnement'
                    : 'Payer abonnement (simulation)'}
              </Text>
            </Button>*/}

              <Link href="/(tabs)/store/contact" className="w-full" asChild>
                <Button className="w-full">
                  <Text className="font-semibold text-white">Contactez nous</Text>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          {!isPartner && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex-row items-center gap-2 text-xl">
                  <Zap size={20} className="text-primary" />
                  Avantages du programme
                </CardTitle>
              </CardHeader>
              <CardContent className="gap-3">
                {[
                  {
                    icon: '♾️',
                    title: 'Publications illimitées',
                    desc: 'Publiez autant que vous le souhaitez',
                  },
                  { icon: '⚡', title: 'Priorité accrue', desc: 'Vos annonces sont plus visibles' },
                  {
                    icon: '🎯',
                    title: 'Meilleur ciblage',
                    desc: 'Atteignez plus de clients potentiels',
                  },
                ].map((benefit, idx) => (
                  <View key={idx} className="bg-secondary/20 flex-row gap-3 rounded-lg p-3">
                    <Text className="text-lg">{benefit.icon}</Text>
                    <View className="flex-1 gap-0.5">
                      <Text className="text-foreground font-semibold">{benefit.title}</Text>
                      <Text className="text-muted-foreground text-xs">{benefit.desc}</Text>
                    </View>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Subscription History Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex-row items-center gap-2">
                <CreditCard size={20} className="text-primary" />
                Historique des abonnements
              </CardTitle>
              <CardDescription>
                {hasSubscriptions
                  ? `${history?.subscriptions?.length} abonnement(s) trouvé(s)`
                  : "Pas encore d'abonnement"}
              </CardDescription>
            </CardHeader>

            <CardContent className="gap-2">
              {hasSubscriptions ? (
                <View className="gap-3">
                  {history?.subscriptions?.map((sub: any, idx: number) => {
                    const status = (sub.status?.toLowerCase() ?? 'pending') as SubscriptionStatus;
                    const statusColor = getStatusColor(status);
                    const StatusIcon = statusColor.icon;

                    return (
                      <View
                        key={sub.id}
                        className={`border-border overflow-hidden rounded-lg border transition-all ${statusColor.bg} active:opacity-70`}>
                        <View className="flex-row items-start gap-3 p-4">
                          <View className={`mt-1 rounded-full p-2 ${statusColor.bg}`}>
                            <StatusIcon size={16} className={statusColor.text} />
                          </View>

                          <View className="flex-1 gap-2">
                            <View className="flex-row items-center justify-between gap-2">
                              <Text className="text-foreground font-bold">
                                {sub.amountFcfa?.toLocaleString()} FCFA
                              </Text>
                              <Badge
                                variant={
                                  status === 'paid'
                                    ? 'default'
                                    : status === 'expired'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                                className="capitalize">
                                <Text className="text-xs font-semibold">{status}</Text>
                              </Badge>
                            </View>

                            <View className="gap-1">
                              <Text className="text-muted-foreground text-xs font-medium">
                                {new Date(sub.startsAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}{' '}
                                →{' '}
                                {new Date(sub.endsAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {idx < (history?.subscriptions?.length ?? 0) - 1 && (
                          <View className="bg-border h-px" />
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View className="bg-secondary/30 gap-3 rounded-lg p-6">
                  <Text className="text-foreground text-center text-base font-semibold">
                    Aucun abonnement pour le moment
                  </Text>
                  <Text className="text-muted-foreground text-center text-sm">
                    Commencez votre abonnement pour accéder aux publications illimitées
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </MotiView>
  );
}
